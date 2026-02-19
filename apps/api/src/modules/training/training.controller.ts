import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TrainingService } from './training.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('training')
@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // ==================== Course CRUD ====================

  @Post('courses')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Create a new training course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.createCourse(user.organizationId, dto, user.sub);
  }

  @Get('courses')
  @ApiOperation({ summary: 'List courses (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of courses' })
  async findAllCourses(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CourseQueryDto,
  ) {
    return this.trainingService.findAllCourses(user.organizationId, query);
  }

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Get training dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.trainingService.getDashboard(user.organizationId);
  }

  @Get('my-courses')
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({ status: 200, description: 'List of enrollments' })
  async getMyCourses(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: EnrollmentQueryDto,
  ) {
    return this.trainingService.getMyCourses(user.organizationId, user.sub, query);
  }

  @Get('my-courses/:enrollmentId')
  @ApiOperation({ summary: 'Get enrollment detail with course and progress' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiResponse({ status: 200, description: 'Enrollment details' })
  async getMyEnrollmentDetail(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.getMyEnrollmentDetail(user.organizationId, enrollmentId, user.sub);
  }

  @Get('courses/:id/compliance')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Get per-store compliance for a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Compliance data by store' })
  async getCourseCompliance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.trainingService.getCourseCompliance(user.organizationId, id);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course detail with lessons and enrollments' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  async findCourseById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.trainingService.findCourseById(user.organizationId, id);
  }

  @Patch('courses/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.updateCourse(user.organizationId, id, dto, user.sub);
  }

  @Delete('courses/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Deactivate course (soft-delete)' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Course deactivated' })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.trainingService.deleteCourse(user.organizationId, id, user.sub);
  }

  // ==================== Lesson Management ====================

  @Post('courses/:courseId/lessons')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Add lesson to course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Lesson created' })
  async addLesson(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.trainingService.addLesson(user.organizationId, courseId, dto);
  }

  @Patch('lessons/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'id', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Lesson updated' })
  async updateLesson(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.trainingService.updateLesson(user.organizationId, id, dto);
  }

  @Delete('lessons/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'id', description: 'Lesson UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Lesson deleted' })
  async deleteLesson(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.trainingService.deleteLesson(user.organizationId, id);
  }

  // ==================== Question Management ====================

  @Post('lessons/:lessonId/questions')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Add quiz question to lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 201, description: 'Question created' })
  async addQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.trainingService.addQuestion(user.organizationId, lessonId, dto);
  }

  @Patch('questions/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update quiz question' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  async updateQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.trainingService.updateQuestion(user.organizationId, id, dto);
  }

  @Delete('questions/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Delete quiz question' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Question deleted' })
  async deleteQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.trainingService.deleteQuestion(user.organizationId, id);
  }

  // ==================== Enrollment ====================

  @Post('courses/:courseId/enroll')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Bulk enroll users in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Users enrolled' })
  async bulkEnroll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Body() dto: BulkEnrollDto,
  ) {
    return this.trainingService.bulkEnroll(user.organizationId, courseId, dto, user.sub);
  }

  @Post('courses/:courseId/enroll-by-role')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Enroll all users with a specific role' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Users enrolled by role' })
  async enrollByRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Body() dto: EnrollByRoleDto,
  ) {
    return this.trainingService.enrollByRole(user.organizationId, courseId, dto, user.sub);
  }

  // ==================== Progress & Completion ====================

  @Post('enrollments/:id/start')
  @ApiOperation({ summary: 'Start a course (ASSIGNED -> IN_PROGRESS)' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID' })
  @ApiResponse({ status: 200, description: 'Course started' })
  async startCourse(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.startCourse(user.organizationId, id, user.sub);
  }

  @Post('progress/:enrollmentId/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark a lesson as completed' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Lesson marked complete' })
  async completeLesson(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.completeLesson(user.organizationId, enrollmentId, lessonId, user.sub);
  }

  @Post('progress/:enrollmentId/lessons/:lessonId/quiz')
  @ApiOperation({ summary: 'Submit quiz answers and get graded results' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Quiz graded' })
  async submitQuiz(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.submitQuiz(user.organizationId, enrollmentId, lessonId, dto, user.sub);
  }

  @Post('enrollments/:id/complete')
  @ApiOperation({ summary: 'Complete course, calculate score, award gamification' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID' })
  @ApiResponse({ status: 200, description: 'Course completed' })
  async completeCourse(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trainingService.completeCourse(user.organizationId, id, user.sub);
  }
}
