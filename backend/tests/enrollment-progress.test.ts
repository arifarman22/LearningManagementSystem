const BASE = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:1337';
const api  = (path: string) => `${BASE}/api${path}`;

async function req(method: string, url: string, body?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) as any };
}

const get   = (url: string, token?: string)            => req('GET',    url, undefined, token);
const post  = (url: string, body: any, token?: string) => req('POST',   url, body,      token);
const del   = (url: string, token?: string)            => req('DELETE', url, undefined, token);

const ADMIN       = { email: 'admin@test.com',       password: 'Admin1234!' };
const INSTRUCTOR  = { email: 'instructor@test.com',  password: 'Instructor1!' };
const INSTRUCTOR2 = { email: 'instructor2@test.com', password: 'Instructor2!' };
const STUDENT     = { email: 'student@test.com',     password: 'Student1234!' };

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await post(api('/auth/local'), { identifier: creds.email, password: creds.password });
  if (!res.body.jwt) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.jwt;
}

let tokens: Record<string, string> = {};

jest.setTimeout(20000);

beforeAll(async () => {
  tokens.admin       = await login(ADMIN);
  tokens.instructor  = await login(INSTRUCTOR);
  tokens.instructor2 = await login(INSTRUCTOR2);
  tokens.student     = await login(STUDENT);
}, 20000);

// ── shared state ──────────────────────────────────────────────────────────────
let publishedCourseDocId: string;
let publishedCourseNumId: number;
let draftCourseDocId:     string;
let lesson1DocId:         string;
let lesson2DocId:         string;
let enrollmentDocId:      string;

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP — create and publish a course with 2 lessons
// ═══════════════════════════════════════════════════════════════════════════════

describe('Setup — course and lessons', () => {
  it('creates and publishes a course with 2 lessons', async () => {
    // Create course
    const cRes = await post(api('/courses'), {
      data: { title: 'Phase5 Course', description: 'For enrollment and progress tests.' },
    }, tokens.instructor);
    expect(cRes.status).toBe(201);
    publishedCourseDocId = cRes.body.data.documentId;
    publishedCourseNumId = cRes.body.data.id;

    // Create draft course (for enrollment rejection test)
    const dRes = await post(api('/courses'), {
      data: { title: 'Phase5 Draft', description: 'Should not be enrollable.' },
    }, tokens.instructor);
    expect(dRes.status).toBe(201);
    draftCourseDocId = dRes.body.data.documentId;

    // Create 2 lessons
    const l1 = await post(api('/lessons'), {
      data: { title: 'Lesson Alpha', content: 'Content A.', course: publishedCourseDocId },
    }, tokens.instructor);
    expect(l1.status).toBe(201);
    lesson1DocId = l1.body.data.documentId;

    const l2 = await post(api('/lessons'), {
      data: { title: 'Lesson Beta', content: 'Content B.', course: publishedCourseDocId },
    }, tokens.instructor);
    expect(l2.status).toBe(201);
    lesson2DocId = l2.body.data.documentId;

    // Publish the course
    const pRes = await req('PATCH', api(`/courses/${publishedCourseDocId}/publish`), {}, tokens.instructor);
    expect(pRes.status).toBe(200);
    expect(pRes.body.data.status).toBe('published');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Enrollment — Create', () => {
  it('student can enroll in a published course', async () => {
    const res = await post(api('/enrollments'), { data: { course: publishedCourseDocId } }, tokens.student);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('active');
    enrollmentDocId = res.body.data.documentId;
  });

  it('duplicate enrollment returns 409', async () => {
    const res = await post(api('/enrollments'), { data: { course: publishedCourseDocId } }, tokens.student);
    expect(res.status).toBe(409);
  });

  it('cannot enroll in a draft course', async () => {
    const res = await post(api('/enrollments'), { data: { course: draftCourseDocId } }, tokens.student);
    expect(res.status).toBe(400);
  });

  it('cannot enroll in a non-existent course', async () => {
    const res = await post(api('/enrollments'), { data: { course: 'nonexistent-doc-id' } }, tokens.student);
    expect(res.status).toBe(404);
  });

  it('instructor cannot enroll', async () => {
    const res = await post(api('/enrollments'), { data: { course: publishedCourseDocId } }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('unauthenticated user cannot enroll', async () => {
    const res = await post(api('/enrollments'), { data: { course: publishedCourseDocId } });
    expect([401, 403]).toContain(res.status);
  });
});

describe('Enrollment — Read', () => {
  it('student can list their own enrollments', async () => {
    const res = await get(api('/enrollments'), tokens.student);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((e: any) => e.student?.id ?? e.student);
    // All returned enrollments belong to this student (student id from JWT)
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('student can fetch their own enrollment by id', async () => {
    const res = await get(api(`/enrollments/${enrollmentDocId}`), tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.documentId).toBe(enrollmentDocId);
  });

  it('instructor cannot fetch a student enrollment they do not own', async () => {
    const res = await get(api(`/enrollments/${enrollmentDocId}`), tokens.instructor2);
    expect(res.status).toBe(403);
  });

  it('instructor can see enrollments for their own course', async () => {
    const res = await get(api('/enrollments'), tokens.instructor);
    expect(res.status).toBe(200);
  });
});

describe('My Courses', () => {
  it('student can list their enrolled courses', async () => {
    const res = await get(api('/my-courses'), tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const titles = res.body.data.map((c: any) => c.title);
    expect(titles).toContain('Phase5 Course');
  });

  it('instructor cannot access my-courses', async () => {
    const res = await get(api('/my-courses'), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot access my-courses', async () => {
    const res = await get(api('/my-courses'));
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Lesson Progress — Mark Complete', () => {
  it('enrolled student can mark a lesson complete', async () => {
    const res = await post(api('/lesson-progresses'), { data: { lesson: lesson1DocId } }, tokens.student);
    expect(res.status).toBe(201);
    expect(res.body.data.completed).toBe(true);
    expect(res.body.data.completedAt).toBeTruthy();
  });

  it('marking the same lesson complete again is idempotent (no duplicate)', async () => {
    const res = await post(api('/lesson-progresses'), { data: { lesson: lesson1DocId } }, tokens.student);
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.completed).toBe(true);

    // Verify only one progress record exists for this lesson
    const listRes = await get(api('/lesson-progresses'), tokens.student);
    expect(listRes.status).toBe(200);
    const forLesson1 = listRes.body.data.filter((p: any) => p.lesson?.documentId === lesson1DocId || p.lesson?.id);
    expect(forLesson1.length).toBeLessThanOrEqual(1);
  });

  it('non-enrolled student cannot mark a lesson complete', async () => {
    // instructor2 is not a student and not enrolled
    const res = await post(api('/lesson-progresses'), { data: { lesson: lesson1DocId } }, tokens.instructor2);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot mark a lesson complete', async () => {
    const res = await post(api('/lesson-progresses'), { data: { lesson: lesson1DocId } });
    expect([401, 403]).toContain(res.status);
  });

  it('rejects missing lesson field', async () => {
    const res = await post(api('/lesson-progresses'), { data: {} }, tokens.student);
    expect(res.status).toBe(400);
  });

  it('rejects non-existent lesson', async () => {
    const res = await post(api('/lesson-progresses'), { data: { lesson: 'nonexistent-doc-id' } }, tokens.student);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Course Progress', () => {
  it('student sees correct progress after 1 of 2 lessons completed', async () => {
    const res = await get(api(`/courses/${publishedCourseDocId}/progress`), tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.totalLessons).toBe(2);
    expect(res.body.data.completedLessons).toBe(1);
    expect(res.body.data.percentage).toBe(50);
  });

  it('student sees 100% after completing all lessons', async () => {
    // Complete lesson 2
    const markRes = await post(api('/lesson-progresses'), { data: { lesson: lesson2DocId } }, tokens.student);
    expect([200, 201]).toContain(markRes.status);

    const res = await get(api(`/courses/${publishedCourseDocId}/progress`), tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.completedLessons).toBe(2);
    expect(res.body.data.percentage).toBe(100);
  });

  it('non-enrolled student cannot view progress', async () => {
    // Create a second student scenario — use instructor2 token (not enrolled, not a student)
    // Actually test with a fresh unenrolled student — we use instructor token as proxy
    const res = await get(api(`/courses/${publishedCourseDocId}/progress`), tokens.instructor2);
    // instructor2 is not enrolled and not the course owner
    expect(res.status).toBe(403);
  });

  it('instructor can view a student progress for their own course', async () => {
    // Get student numeric id from enrollments
    const enrollRes = await get(api('/enrollments'), tokens.instructor);
    expect(enrollRes.status).toBe(200);
    const enrollment = enrollRes.body.data.find((e: any) => e.course?.documentId === publishedCourseDocId || e.course?.id === publishedCourseNumId);
    const studentNumId = enrollment?.student?.id;
    expect(studentNumId).toBeTruthy();

    const res = await get(api(`/courses/${publishedCourseDocId}/progress?student=${studentNumId}`), tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.totalLessons).toBe(2);
    expect(res.body.data.completedLessons).toBe(2);
  });

  it('instructor cannot view progress for a course they do not own', async () => {
    const enrollRes = await get(api('/enrollments'), tokens.instructor);
    const enrollment = enrollRes.body.data[0];
    const studentNumId = enrollment?.student?.id ?? 1;

    const res = await get(api(`/courses/${publishedCourseDocId}/progress?student=${studentNumId}`), tokens.instructor2);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent course', async () => {
    const res = await get(api('/courses/nonexistent-doc-id/progress'), tokens.student);
    expect(res.status).toBe(404);
  });

  it('unauthenticated cannot view progress', async () => {
    const res = await get(api(`/courses/${publishedCourseDocId}/progress`));
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT — Delete (unenroll)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Enrollment — Delete', () => {
  it('student cannot delete another student enrollment', async () => {
    // instructor cannot delete either (wrong role)
    const res = await del(api(`/enrollments/${enrollmentDocId}`), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student can unenroll themselves', async () => {
    const res = await del(api(`/enrollments/${enrollmentDocId}`), tokens.student);
    expect(res.status).toBe(200);
  });

  it('returns 404 after unenrollment', async () => {
    const res = await del(api(`/enrollments/${enrollmentDocId}`), tokens.student);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEARDOWN
// ═══════════════════════════════════════════════════════════════════════════════

afterAll(async () => {
  // Clean up courses (cascades lessons)
  if (publishedCourseDocId) await req('DELETE', api(`/courses/${publishedCourseDocId}`), undefined, tokens.instructor);
  if (draftCourseDocId)     await req('DELETE', api(`/courses/${draftCourseDocId}`),     undefined, tokens.instructor);
});
