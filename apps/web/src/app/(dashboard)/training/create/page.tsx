'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types
type LessonType = 'TEXT' | 'PDF' | 'VIDEO' | 'QUIZ';
type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
type Category = 'OPERATIONS' | 'CASH_MANAGEMENT' | 'CUSTOMER_SERVICE' | 'INVENTORY' | 'COMPLIANCE' | 'SAFETY';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  sortOrder: number;
  questionText: string;
  type: QuestionType;
  options: QuestionOption[];
  explanation: string;
}

interface Lesson {
  sortOrder: number;
  title: string;
  type: LessonType;
  content: string;
  fileUrl: string;
  estimatedMinutes: number | null;
  isRequired: boolean;
  questions: Question[];
}

interface CourseFormData {
  title: string;
  description: string;
  category: Category;
  estimatedDurationMinutes: number | null;
  passingScore: number;
  isMandatory: boolean;
  certificationValidDays: number | null;
  lessons: Lesson[];
}

const categoryLabels: Record<Category, string> = {
  OPERATIONS: 'Operaciones',
  CASH_MANAGEMENT: 'Manejo de Caja',
  CUSTOMER_SERVICE: 'Servicio al Cliente',
  INVENTORY: 'Inventario',
  COMPLIANCE: 'Cumplimiento',
  SAFETY: 'Seguridad',
};

const lessonTypeLabels: Record<LessonType, string> = {
  TEXT: 'Texto',
  PDF: 'PDF',
  VIDEO: 'Video',
  QUIZ: 'Cuestionario',
};

const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Opción Múltiple',
  TRUE_FALSE: 'Verdadero/Falso',
};

export default function CreateTrainingCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: 'OPERATIONS',
    estimatedDurationMinutes: null,
    passingScore: 70,
    isMandatory: false,
    certificationValidDays: null,
    lessons: [],
  });

  // Add new lesson
  const addLesson = () => {
    setFormData({
      ...formData,
      lessons: [
        ...formData.lessons,
        {
          sortOrder: formData.lessons.length,
          title: '',
          type: 'TEXT',
          content: '',
          fileUrl: '',
          estimatedMinutes: null,
          isRequired: true,
          questions: [],
        },
      ],
    });
  };

  // Remove lesson
  const removeLesson = (index: number) => {
    const newLessons = formData.lessons.filter((_, i) => i !== index);
    // Recompute sortOrder
    newLessons.forEach((lesson, i) => {
      lesson.sortOrder = i;
    });
    setFormData({ ...formData, lessons: newLessons });
  };

  // Update lesson field
  const updateLesson = (index: number, field: keyof Lesson, value: any) => {
    const newLessons = [...formData.lessons];
    newLessons[index] = { ...newLessons[index], [field]: value };

    // If type changes to TRUE_FALSE, reset questions
    if (field === 'type' && value !== 'QUIZ') {
      newLessons[index].questions = [];
    }

    setFormData({ ...formData, lessons: newLessons });
  };

  // Add question to lesson
  const addQuestion = (lessonIndex: number) => {
    const newLessons = [...formData.lessons];
    const lesson = newLessons[lessonIndex];

    const newQuestion: Question = {
      sortOrder: lesson.questions.length,
      questionText: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: '',
    };

    lesson.questions.push(newQuestion);
    setFormData({ ...formData, lessons: newLessons });
  };

  // Remove question from lesson
  const removeQuestion = (lessonIndex: number, questionIndex: number) => {
    const newLessons = [...formData.lessons];
    const lesson = newLessons[lessonIndex];
    lesson.questions = lesson.questions.filter((_, i) => i !== questionIndex);
    // Recompute sortOrder
    lesson.questions.forEach((q, i) => {
      q.sortOrder = i;
    });
    setFormData({ ...formData, lessons: newLessons });
  };

  // Update question field
  const updateQuestion = (
    lessonIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: any
  ) => {
    const newLessons = [...formData.lessons];
    const question = newLessons[lessonIndex].questions[questionIndex];

    if (field === 'type') {
      // Reset options based on type
      if (value === 'TRUE_FALSE') {
        question.options = [
          { text: 'Verdadero', isCorrect: false },
          { text: 'Falso', isCorrect: false },
        ];
      } else {
        question.options = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ];
      }
    }

    (question as any)[field] = value;
    setFormData({ ...formData, lessons: newLessons });
  };

  // Update question option
  const updateQuestionOption = (
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
    field: 'text' | 'isCorrect',
    value: any
  ) => {
    const newLessons = [...formData.lessons];
    const options = newLessons[lessonIndex].questions[questionIndex].options;

    if (field === 'isCorrect' && value) {
      // Only one option can be correct - uncheck others
      options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex;
      });
    } else {
      (options[optionIndex] as any)[field] = value;
    }

    setFormData({ ...formData, lessons: newLessons });
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'El título es requerido';
    }

    if (formData.lessons.length === 0) {
      return 'Debe agregar al menos una lección';
    }

    for (let i = 0; i < formData.lessons.length; i++) {
      const lesson = formData.lessons[i];
      if (!lesson.title.trim()) {
        return `La lección ${i + 1} requiere un título`;
      }

      if (lesson.type === 'TEXT' && !lesson.content.trim()) {
        return `La lección ${i + 1} de tipo Texto requiere contenido`;
      }

      if ((lesson.type === 'PDF' || lesson.type === 'VIDEO') && !lesson.fileUrl.trim()) {
        return `La lección ${i + 1} requiere una URL de archivo`;
      }

      if (lesson.type === 'QUIZ') {
        if (lesson.questions.length === 0) {
          return `La lección ${i + 1} de tipo Cuestionario requiere al menos una pregunta`;
        }

        for (let j = 0; j < lesson.questions.length; j++) {
          const question = lesson.questions[j];
          if (!question.questionText.trim()) {
            return `Pregunta ${j + 1} en lección ${i + 1} requiere texto`;
          }

          const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
          if (!hasCorrectAnswer) {
            return `Pregunta ${j + 1} en lección ${i + 1} requiere una respuesta correcta`;
          }

          if (question.type === 'MULTIPLE_CHOICE') {
            const hasEmptyOption = question.options.some(opt => !opt.text.trim());
            if (hasEmptyOption) {
              return `Pregunta ${j + 1} en lección ${i + 1} tiene opciones vacías`;
            }
          }
        }
      }
    }

    return null;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      // Prepare payload
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        passingScore: formData.passingScore,
        isMandatory: formData.isMandatory,
        certificationValidDays: formData.isMandatory ? formData.certificationValidDays : undefined,
        estimatedDurationMinutes: formData.estimatedDurationMinutes,
        lessons: formData.lessons.map(lesson => ({
          sortOrder: lesson.sortOrder,
          title: lesson.title,
          type: lesson.type,
          content: lesson.type === 'TEXT' ? lesson.content : undefined,
          fileUrl: lesson.type === 'PDF' || lesson.type === 'VIDEO' ? lesson.fileUrl : undefined,
          estimatedMinutes: lesson.estimatedMinutes,
          isRequired: lesson.isRequired,
          questions: lesson.type === 'QUIZ' ? lesson.questions.map(q => ({
            sortOrder: q.sortOrder,
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            explanation: q.explanation || undefined,
          })) : undefined,
        })),
      };

      const response = await fetch(`${baseUrl}/api/v1/training/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al crear el curso');
      }

      router.push('/training');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/training" className="hover:text-gray-900">
            Entrenamiento
          </Link>
          <span>/</span>
          <span className="text-gray-900">Crear Curso</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Curso de Entrenamiento</h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Informacion Basica */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ej: Introducción a las Operaciones de Tienda"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Descripción del curso..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración Estimada (minutos)
                </label>
                <input
                  type="number"
                  value={formData.estimatedDurationMinutes ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    estimatedDurationMinutes: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min="0"
                />
              </div>

              {/* Passing Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntuación Mínima (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Is Mandatory */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Curso Obligatorio</span>
              </label>
            </div>

            {/* Certification Valid Days */}
            {formData.isMandatory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validez de Certificación (días)
                </label>
                <input
                  type="number"
                  value={formData.certificationValidDays ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    certificationValidDays: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min="0"
                  placeholder="Ej: 365 (un año)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Lecciones */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lecciones</h2>
            <button
              type="button"
              onClick={addLesson}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Agregar Lección
            </button>
          </div>

          {formData.lessons.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay lecciones. Haga clic en "Agregar Lección" para comenzar.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-md font-semibold text-gray-800">
                      Lección {lessonIndex + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeLesson(lessonIndex)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Lesson Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(lessonIndex, 'title', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Lesson Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(lessonIndex, 'type', e.target.value as LessonType)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                          {Object.entries(lessonTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Minutes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración Estimada (min)
                        </label>
                        <input
                          type="number"
                          value={lesson.estimatedMinutes ?? ''}
                          onChange={(e) => updateLesson(
                            lessonIndex,
                            'estimatedMinutes',
                            e.target.value ? parseInt(e.target.value) : null
                          )}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Content (for TEXT type) */}
                    {lesson.type === 'TEXT' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contenido <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={lesson.content}
                          onChange={(e) => updateLesson(lessonIndex, 'content', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          rows={4}
                        />
                      </div>
                    )}

                    {/* File URL (for PDF/VIDEO) */}
                    {(lesson.type === 'PDF' || lesson.type === 'VIDEO') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL del Archivo <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={lesson.fileUrl}
                          onChange={(e) => updateLesson(lessonIndex, 'fileUrl', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {/* Is Required */}
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={lesson.isRequired}
                          onChange={(e) => updateLesson(lessonIndex, 'isRequired', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Lección Requerida</span>
                      </label>
                    </div>

                    {/* Questions (for QUIZ type) */}
                    {lesson.type === 'QUIZ' && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">Preguntas</h4>
                          <button
                            type="button"
                            onClick={() => addQuestion(lessonIndex)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
                          >
                            Agregar Pregunta
                          </button>
                        </div>

                        {lesson.questions.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4">
                            No hay preguntas. Haga clic en "Agregar Pregunta".
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {lesson.questions.map((question, questionIndex) => (
                              <div
                                key={questionIndex}
                                className="bg-gray-50 border border-gray-200 rounded-md p-3"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Pregunta {questionIndex + 1}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(lessonIndex, questionIndex)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>

                                {/* Question Text */}
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Texto de la Pregunta <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={question.questionText}
                                    onChange={(e) =>
                                      updateQuestion(lessonIndex, questionIndex, 'questionText', e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                  />
                                </div>

                                {/* Question Type */}
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tipo <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={question.type}
                                    onChange={(e) =>
                                      updateQuestion(
                                        lessonIndex,
                                        questionIndex,
                                        'type',
                                        e.target.value as QuestionType
                                      )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                  >
                                    {Object.entries(questionTypeLabels).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Options */}
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Opciones <span className="text-red-500">*</span>
                                  </label>
                                  <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name={`question-${lessonIndex}-${questionIndex}`}
                                          checked={option.isCorrect}
                                          onChange={() =>
                                            updateQuestionOption(
                                              lessonIndex,
                                              questionIndex,
                                              optionIndex,
                                              'isCorrect',
                                              true
                                            )
                                          }
                                          className="rounded-full border-gray-300"
                                        />
                                        <input
                                          type="text"
                                          value={option.text}
                                          onChange={(e) =>
                                            updateQuestionOption(
                                              lessonIndex,
                                              questionIndex,
                                              optionIndex,
                                              'text',
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                                          placeholder={`Opción ${optionIndex + 1}`}
                                          disabled={question.type === 'TRUE_FALSE'}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Seleccione la respuesta correcta
                                  </p>
                                </div>

                                {/* Explanation */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Explicación (opcional)
                                  </label>
                                  <textarea
                                    value={question.explanation}
                                    onChange={(e) =>
                                      updateQuestion(lessonIndex, questionIndex, 'explanation', e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/training"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando...' : 'Crear Curso'}
          </button>
        </div>
      </form>
    </div>
  );
}
