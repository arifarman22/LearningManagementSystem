// ── Roles ────────────────────────────────────────────────────────────────────
export type RoleType = 'admin' | 'content-manager' | 'instructor' | 'student' | 'authenticated' | 'public';

export interface Role {
  id: number;
  name: string;
  type: RoleType;
  description?: string;
}

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role: Role | null;
  createdAt: string;
}

export interface AuthUser extends User {
  jwt: string;
}

// ── Course ───────────────────────────────────────────────────────────────────
export type CourseStatus = 'draft' | 'published';

export interface Course {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  status: CourseStatus;
  thumbnail?: { url: string; alternativeText?: string } | null;
  instructor?: Pick<User, 'id' | 'username' | 'email'> | null;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

// ── Lesson ───────────────────────────────────────────────────────────────────
export interface Lesson {
  id: number;
  documentId: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  order: number;
  course?: Pick<Course, 'id' | 'documentId' | 'title'> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Enrollment ───────────────────────────────────────────────────────────────
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Enrollment {
  id: number;
  documentId: string;
  student?: Pick<User, 'id' | 'username' | 'email'> | null;
  course?: Course | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Progress ─────────────────────────────────────────────────────────────────
export interface LessonProgress {
  id: number;
  documentId: string;
  lesson?: Pick<Lesson, 'id' | 'documentId' | 'title'> | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
export interface Option {
  id: number;
  documentId: string;
  text: string;
  // isCorrect is NEVER present for students — only instructors/admin
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  documentId: string;
  text: string;
  order: number;
  options?: Option[];
}

export interface Quiz {
  id: number;
  documentId: string;
  title: string;
  course?: Pick<Course, 'id' | 'documentId' | 'title'> | null;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

// answers: { [questionId: number]: optionId: number }
export type QuizAnswers = Record<number, number>;

export interface QuizResult {
  id: number;
  documentId: string;
  quiz?: Pick<Quiz, 'id' | 'documentId' | 'title'> | null;
  student?: Pick<User, 'id' | 'username'> | null;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAt: string;
  createdAt: string;
}

// ── Blog ─────────────────────────────────────────────────────────────────────
export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  body: string;
  status: BlogStatus;
  coverImage?: { url: string; alternativeText?: string } | null;
  author?: { id: number; username: string } | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
export interface PlatformStats {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
  };
  enrollments: {
    total: number;
    active: number;
  };
  blogPosts: {
    total: number;
    published: number;
    draft: number;
  };
  quizzes: {
    total: number;
    results: number;
  };
  lessons: {
    total: number;
  };
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ApiSingleResponse<T> {
  data: T;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
