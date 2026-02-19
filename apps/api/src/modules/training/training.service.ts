import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  EnrollmentQueryDto,
  BulkEnrollDto,
  EnrollByRoleDto,
  SubmitQuizDto,
  CreateLessonDto,
  CreateQuizQuestionDto,
} from './dto';
import {
  TrainingEnrollmentStatus,
  TrainingProgressStatus,
  AuditEntityType,
  AuditAction,
  GamificationActionType,
} from '@prisma/client';

@Injectable()
export class TrainingService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private gamificationService: GamificationService,
  ) {}

  // ==================== Helpers ====================

  private validateQuizOptions(options: any[]) {
    const correctCount = options.filter((o: any) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException(
        'Each question must have exactly 1 correct answer',
      );
    }
  }

  // ==================== Course CRUD ====================

  async createCourse(orgId: string, dto: CreateCourseDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    // Validate quiz options before creating
    if (dto.lessons) {
      for (const lesson of dto.lessons) {
        if (lesson.questions && lesson.questions.length > 0) {
          for (const q of lesson.questions) {
            this.validateQuizOptions(q.options);
          }
        }
      }
    }

    const course = await tp.trainingCourse.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        passingScore: dto.passingScore ?? 70,
        isMandatory: dto.isMandatory ?? false,
        scope: dto.scope ?? 'ALL',
        targetStoreIds: dto.targetStoreIds || [],
        targetRoleIds: dto.targetRoleIds || [],
        certificationValidDays: dto.certificationValidDays,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        createdById: userId,
        lessons: dto.lessons
          ? {
              create: dto.lessons.map((lesson) => ({
                sortOrder: lesson.sortOrder,
                title: lesson.title,
                type: lesson.type,
                content: lesson.content,
                fileUrl: lesson.fileUrl,
                estimatedMinutes: lesson.estimatedMinutes,
                isRequired: lesson.isRequired ?? true,
                questions:
                  lesson.questions && lesson.questions.length > 0
                    ? {
                        create: lesson.questions.map((q) => ({
                          sortOrder: q.sortOrder,
                          questionText: q.questionText,
                          type: q.type,
                          options: q.options as any,
                          explanation: q.explanation,
                        })),
                      }
                    : undefined,
              })),
            }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lessons: {
          where: { isActive: true },
          include: { questions: { where: { isActive: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.TRAINING_COURSE,
        entityId: course.id,
        action: AuditAction.CREATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Created training course: ${course.title}`,
      });
    }

    return course;
  }

  // 3a: Fix N+1 — batch completedCounts via groupBy
  async findAllCourses(orgId: string, query: CourseQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      tp.trainingCourse.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tp.trainingCourse.count({ where }),
    ]);

    // Batch query for completed counts instead of N+1
    const courseIds = courses.map((c) => c.id);
    const completedCounts = await tp.trainingEnrollment.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
        status: TrainingEnrollmentStatus.COMPLETED,
      },
      _count: true,
    });
    const countMap = new Map(
      completedCounts.map((c) => [c.courseId, c._count]),
    );

    const coursesWithStats = courses.map((course) => {
      const completedCount = countMap.get(course.id) ?? 0;
      return {
        ...course,
        completedEnrollments: completedCount,
        completionRate:
          course._count.enrollments > 0
            ? Math.round((completedCount / course._count.enrollments) * 100)
            : 0,
      };
    });

    return {
      data: coursesWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 3j: Limit enrollments loaded, add total count
  async findCourseById(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const course = await tp.trainingCourse.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lessons: {
          where: { isActive: true },
          include: {
            questions: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        enrollments: {
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                store: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const completedCount = await tp.trainingEnrollment.count({
      where: { courseId: id, status: TrainingEnrollmentStatus.COMPLETED },
    });

    return {
      ...course,
      completedEnrollments: completedCount,
      completionRate:
        course._count.enrollments > 0
          ? Math.round((completedCount / course._count.enrollments) * 100)
          : 0,
    };
  }

  async updateCourse(orgId: string, id: string, dto: UpdateCourseDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingCourse.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Training course not found');
    }

    const updated = await tp.trainingCourse.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        passingScore: dto.passingScore,
        isMandatory: dto.isMandatory,
        scope: dto.scope,
        targetStoreIds: dto.targetStoreIds,
        targetRoleIds: dto.targetRoleIds,
        certificationValidDays: dto.certificationValidDays,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.TRAINING_COURSE,
        entityId: id,
        action: AuditAction.UPDATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Updated training course: ${updated.title}`,
      });
    }

    return updated;
  }

  async deleteCourse(orgId: string, id: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingCourse.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Training course not found');
    }

    await tp.trainingCourse.update({
      where: { id },
      data: { isActive: false },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.TRAINING_COURSE,
        entityId: id,
        action: AuditAction.DELETED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Deactivated training course: ${existing.title}`,
      });
    }
  }

  // ==================== Lesson Management ====================

  async addLesson(orgId: string, courseId: string, dto: CreateLessonDto) {
    const tp = this.prisma.forTenant(orgId);

    const course = await tp.trainingCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    // Validate quiz options
    if (dto.questions && dto.questions.length > 0) {
      for (const q of dto.questions) {
        this.validateQuizOptions(q.options);
      }
    }

    return tp.trainingLesson.create({
      data: {
        courseId,
        sortOrder: dto.sortOrder,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        fileUrl: dto.fileUrl,
        estimatedMinutes: dto.estimatedMinutes,
        isRequired: dto.isRequired ?? true,
        questions:
          dto.questions && dto.questions.length > 0
            ? {
                create: dto.questions.map((q) => ({
                  sortOrder: q.sortOrder,
                  questionText: q.questionText,
                  type: q.type,
                  options: q.options as any,
                  explanation: q.explanation,
                })),
              }
            : undefined,
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async updateLesson(orgId: string, id: string, dto: Partial<CreateLessonDto>) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingLesson.findUnique({
      where: { id },
    });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Training lesson not found');
    }

    return tp.trainingLesson.update({
      where: { id },
      data: {
        sortOrder: dto.sortOrder,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        fileUrl: dto.fileUrl,
        estimatedMinutes: dto.estimatedMinutes,
        isRequired: dto.isRequired,
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  // 3k: Soft delete lesson
  async deleteLesson(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingLesson.findUnique({
      where: { id },
    });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Training lesson not found');
    }
    await tp.trainingLesson.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Question Management ====================

  async addQuestion(orgId: string, lessonId: string, dto: CreateQuizQuestionDto) {
    const tp = this.prisma.forTenant(orgId);

    const lesson = await tp.trainingLesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || !lesson.isActive) {
      throw new NotFoundException('Training lesson not found');
    }

    // Validate exactly 1 correct option
    this.validateQuizOptions(dto.options);

    return tp.trainingQuizQuestion.create({
      data: {
        lessonId,
        sortOrder: dto.sortOrder,
        questionText: dto.questionText,
        type: dto.type,
        options: dto.options as any,
        explanation: dto.explanation,
      },
    });
  }

  async updateQuestion(orgId: string, id: string, dto: Partial<CreateQuizQuestionDto>) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingQuizQuestion.findUnique({
      where: { id },
    });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Training quiz question not found');
    }

    // Validate options if provided
    if (dto.options) {
      this.validateQuizOptions(dto.options);
    }

    return tp.trainingQuizQuestion.update({
      where: { id },
      data: {
        sortOrder: dto.sortOrder,
        questionText: dto.questionText,
        type: dto.type,
        options: dto.options as any,
        explanation: dto.explanation,
      },
    });
  }

  // 3k: Soft delete question
  async deleteQuestion(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.trainingQuizQuestion.findUnique({
      where: { id },
    });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Training quiz question not found');
    }
    await tp.trainingQuizQuestion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Enrollment ====================

  // 3f: Replace loop with createMany
  async bulkEnroll(
    orgId: string,
    courseId: string,
    dto: BulkEnrollDto,
    assignedById: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const course = await tp.trainingCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    await tp.trainingEnrollment.createMany({
      data: dto.userIds.map((userId) => ({ courseId, userId, assignedById })),
      skipDuplicates: true,
    });

    const enrollments = await tp.trainingEnrollment.findMany({
      where: { courseId, userId: { in: dto.userIds } },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return { enrolled: enrollments.length, enrollments };
  }

  // 3g: Replace loop with createMany
  async enrollByRole(
    orgId: string,
    courseId: string,
    dto: EnrollByRoleDto,
    assignedById: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const course = await tp.trainingCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const where: any = { role: dto.role, isActive: true };
    if (dto.storeIds && dto.storeIds.length > 0) {
      where.storeId = { in: dto.storeIds };
    }

    const users = await tp.user.findMany({
      where,
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    await tp.trainingEnrollment.createMany({
      data: userIds.map((userId) => ({ courseId, userId, assignedById })),
      skipDuplicates: true,
    });

    const enrolledCount = await tp.trainingEnrollment.count({
      where: { courseId, userId: { in: userIds } },
    });

    return { enrolled: enrolledCount, totalUsersInRole: users.length };
  }

  // ==================== My Courses (Employee) ====================

  // 3b: Fix N+1 — include lesson count in initial query
  async getMyCourses(orgId: string, userId: string, query: EnrollmentQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const where: any = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const enrollments = await tp.trainingEnrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            passingScore: true,
            isMandatory: true,
            estimatedDurationMinutes: true,
            certificationValidDays: true,
            _count: { select: { lessons: true } },
          },
        },
        progress: {
          select: { id: true, lessonId: true, status: true, score: true },
        },
        _count: { select: { progress: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enrollment) => {
      const totalLessons = enrollment.course._count.lessons;
      const completedLessons = enrollment.progress.filter(
        (p) => p.status === TrainingProgressStatus.COMPLETED,
      ).length;

      return {
        ...enrollment,
        totalLessons,
        completedLessons,
        progressFraction: totalLessons > 0 ? completedLessons / totalLessons : 0,
      };
    });
  }

  async getMyEnrollmentDetail(orgId: string, enrollmentId: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const enrollment = await tp.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              where: { isActive: true },
              include: {
                questions: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId !== userId) {
      throw new BadRequestException('This enrollment does not belong to you');
    }

    return enrollment;
  }

  // ==================== Progress & Completion ====================

  async startCourse(orgId: string, enrollmentId: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const enrollment = await tp.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    if (enrollment.userId !== userId) {
      throw new BadRequestException('This enrollment does not belong to you');
    }
    if (enrollment.status !== TrainingEnrollmentStatus.ASSIGNED) {
      throw new BadRequestException('Course already started or completed');
    }

    return tp.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: TrainingEnrollmentStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  // 3d: Add status validation
  async completeLesson(
    orgId: string,
    enrollmentId: string,
    lessonId: string,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const enrollment = await tp.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    if (enrollment.userId !== userId) {
      throw new BadRequestException('This enrollment does not belong to you');
    }
    if (enrollment.status === TrainingEnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify a completed course');
    }
    if (enrollment.status === TrainingEnrollmentStatus.ASSIGNED) {
      throw new BadRequestException('Start the course first');
    }

    const lesson = await tp.trainingLesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || !lesson.isActive || lesson.courseId !== enrollment.courseId) {
      throw new BadRequestException('Lesson not found in this course');
    }

    // Only non-QUIZ lessons can be marked complete here
    if (lesson.type === 'QUIZ') {
      throw new BadRequestException(
        'Quiz lessons must be completed through the quiz endpoint',
      );
    }

    return tp.trainingProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      update: {
        status: TrainingProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
      create: {
        enrollmentId,
        lessonId,
        status: TrainingProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  // 3d, 3e, 3i: Status validation, quiz grading validation, increment attempts
  async submitQuiz(
    orgId: string,
    enrollmentId: string,
    lessonId: string,
    dto: SubmitQuizDto,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const enrollment = await tp.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    if (enrollment.userId !== userId) {
      throw new BadRequestException('This enrollment does not belong to you');
    }
    if (enrollment.status === TrainingEnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify a completed course');
    }
    if (enrollment.status === TrainingEnrollmentStatus.ASSIGNED) {
      throw new BadRequestException('Start the course first');
    }

    const lesson = await tp.trainingLesson.findUnique({
      where: { id: lessonId },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!lesson || !lesson.isActive || lesson.courseId !== enrollment.courseId) {
      throw new BadRequestException('Lesson not found in this course');
    }
    if (lesson.type !== 'QUIZ') {
      throw new BadRequestException('This lesson is not a quiz');
    }

    // 3e: Validate quiz answers
    if (dto.answers.length !== lesson.questions.length) {
      throw new BadRequestException(
        `Must answer all ${lesson.questions.length} questions`,
      );
    }
    const qIds = dto.answers.map((a) => a.questionId);
    if (new Set(qIds).size !== qIds.length) {
      throw new BadRequestException('Duplicate answers');
    }
    const validIds = new Set(lesson.questions.map((q) => q.id));
    if (!qIds.every((id) => validIds.has(id))) {
      throw new BadRequestException('Invalid question IDs');
    }

    // Grade quiz
    let correctCount = 0;
    const results = lesson.questions.map((question) => {
      const answer = dto.answers.find((a) => a.questionId === question.id);
      const options = question.options as any[];
      const selectedIndex = answer?.selectedOptionIndex ?? -1;
      const isCorrect =
        selectedIndex >= 0 &&
        selectedIndex < options.length &&
        options[selectedIndex]?.isCorrect === true;

      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        correctOptionIndex: options.findIndex((o: any) => o.isCorrect),
        explanation: question.explanation,
      };
    });

    const score =
      lesson.questions.length > 0
        ? Math.round((correctCount / lesson.questions.length) * 100)
        : 0;

    // 3i: Use increment for attempts to avoid race condition
    const progress = await tp.trainingProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      update: {
        status: TrainingProgressStatus.COMPLETED,
        score,
        attempts: { increment: 1 },
        completedAt: new Date(),
      },
      create: {
        enrollmentId,
        lessonId,
        status: TrainingProgressStatus.COMPLETED,
        score,
        attempts: 1,
        completedAt: new Date(),
      },
    });

    return {
      score,
      correctCount,
      totalQuestions: lesson.questions.length,
      results,
      progress,
    };
  }

  // 3h: Wrap enrollment update in $transaction
  async completeCourse(orgId: string, enrollmentId: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const enrollment = await tp.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
        progress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    if (enrollment.userId !== userId) {
      throw new BadRequestException('This enrollment does not belong to you');
    }
    if (enrollment.status === TrainingEnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Course already completed');
    }

    // Check all required lessons are completed (only active lessons)
    const requiredLessons = await tp.trainingLesson.findMany({
      where: { courseId: enrollment.courseId, isRequired: true, isActive: true },
    });

    const completedLessonIds = enrollment.progress
      .filter((p) => p.status === TrainingProgressStatus.COMPLETED)
      .map((p) => p.lessonId);

    const incompleteLessons = requiredLessons.filter(
      (l) => !completedLessonIds.includes(l.id),
    );

    if (incompleteLessons.length > 0) {
      throw new BadRequestException(
        `${incompleteLessons.length} required lesson(s) not yet completed`,
      );
    }

    // Calculate average score across QUIZ lessons
    const quizProgress = enrollment.progress.filter((p) => p.score !== null);
    const avgScore =
      quizProgress.length > 0
        ? Math.round(
            quizProgress.reduce((sum, p) => sum + (p.score ?? 0), 0) /
              quizProgress.length,
          )
        : 100;

    const passed = avgScore >= enrollment.course.passingScore;
    const certExpiresAt =
      passed && enrollment.course.certificationValidDays
        ? new Date(
            Date.now() +
              enrollment.course.certificationValidDays * 24 * 60 * 60 * 1000,
          )
        : null;

    // Wrap enrollment update in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: passed
            ? TrainingEnrollmentStatus.COMPLETED
            : TrainingEnrollmentStatus.IN_PROGRESS,
          score: avgScore,
          completedAt: passed ? new Date() : null,
          certificateExpiresAt: certExpiresAt,
        },
        include: {
          course: {
            select: { id: true, title: true, passingScore: true },
          },
        },
      });
    });

    // Gamification calls outside transaction (uses its own prisma client)
    if (passed) {
      await this.gamificationService.onActionCompleted(
        orgId,
        GamificationActionType.TRAINING_COMPLETED,
        userId,
        'TRAINING_ENROLLMENT',
        enrollmentId,
      );

      if (avgScore === 100) {
        await this.gamificationService.onActionCompleted(
          orgId,
          GamificationActionType.PERFECT_TRAINING_SCORE,
          userId,
          'TRAINING_ENROLLMENT',
          enrollmentId,
        );
      }
    }

    return {
      ...updated,
      passed,
      avgScore,
    };
  }

  // ==================== Dashboard ====================

  async getDashboard(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    const [
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      mandatoryCourses,
    ] = await Promise.all([
      tp.trainingCourse.count({ where: { isActive: true } }),
      tp.trainingEnrollment.count(),
      tp.trainingEnrollment.count({
        where: { status: TrainingEnrollmentStatus.COMPLETED },
      }),
      tp.trainingCourse.count({
        where: { isActive: true, isMandatory: true },
      }),
    ]);

    const overdueCount = await tp.trainingEnrollment.count({
      where: {
        status: {
          in: [
            TrainingEnrollmentStatus.ASSIGNED,
            TrainingEnrollmentStatus.IN_PROGRESS,
          ],
        },
        course: { isMandatory: true },
      },
    });

    return {
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate:
        totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0,
      mandatoryCourses,
      overdueMandatory: overdueCount,
    };
  }

  // 3c: Fix N+1 — batch queries instead of per-store loop
  async getCourseCompliance(orgId: string, courseId: string) {
    const tp = this.prisma.forTenant(orgId);

    const course = await tp.trainingCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const stores = await tp.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const storeIds = stores.map((s) => s.id);

    // Batch: user counts per store
    const userCounts = await tp.user.groupBy({
      by: ['storeId'],
      where: { storeId: { in: storeIds }, isActive: true },
      _count: true,
    });
    const userCountMap = new Map(
      userCounts.map((u) => [u.storeId, u._count]),
    );

    // Batch: all enrollments for this course with user's storeId
    const enrollments = await tp.trainingEnrollment.findMany({
      where: { courseId, user: { storeId: { in: storeIds } } },
      select: {
        status: true,
        user: { select: { storeId: true } },
      },
    });

    // Aggregate in JS
    const enrolledByStore = new Map<string, number>();
    const completedByStore = new Map<string, number>();
    for (const e of enrollments) {
      const sid = e.user.storeId;
      if (!sid) continue;
      enrolledByStore.set(sid, (enrolledByStore.get(sid) ?? 0) + 1);
      if (e.status === TrainingEnrollmentStatus.COMPLETED) {
        completedByStore.set(sid, (completedByStore.get(sid) ?? 0) + 1);
      }
    }

    const complianceByStore = stores
      .map((store) => {
        const enrolled = enrolledByStore.get(store.id) ?? 0;
        const completed = completedByStore.get(store.id) ?? 0;
        return {
          storeId: store.id,
          storeName: store.name,
          totalUsers: userCountMap.get(store.id) ?? 0,
          enrolled,
          completed,
          completionRate:
            enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
        };
      })
      .filter((s) => s.enrolled > 0);

    return {
      courseId: course.id,
      courseTitle: course.title,
      complianceByStore,
    };
  }
}
