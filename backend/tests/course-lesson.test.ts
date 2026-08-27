export {};

import http from 'http';

const BASE = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:1337';
const api  = (path: string) => `${BASE}/api${path}`;

// ── fetch helpers ─────────────────────────────────────────────────────────────
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

const get   = (url: string, token?: string)              => req('GET',    url, undefined, token);
const post  = (url: string, body: any, token?: string)   => req('POST',   url, body,      token);
const put   = (url: string, body: any, token?: string)   => req('PUT',    url, body,      token);
const patch = (url: string, body: any, token?: string)   => req('PATCH',  url, body,      token);
const del   = (url: string, token?: string)              => req('DELETE', url, undefined, token);

// ── credentials ───────────────────────────────────────────────────────────────
const ADMIN       = { email: process.env.TEST_ADMIN_EMAIL       ?? 'admin@test.com',       password: process.env.TEST_ADMIN_PASSWORD       ?? 'Admin1234!' };
const INSTRUCTOR  = { email: process.env.TEST_INSTRUCTOR_EMAIL  ?? 'instructor@test.com',  password: process.env.TEST_INSTRUCTOR_PASSWORD  ?? 'Instructor1!' };
const INSTRUCTOR2 = { email: process.env.TEST_INSTRUCTOR2_EMAIL ?? 'instructor2@test.com', password: process.env.TEST_INSTRUCTOR2_PASSWORD ?? 'Instructor2!' };
const STUDENT     = { email: process.env.TEST_STUDENT_EMAIL     ?? 'student@test.com',     password: process.env.TEST_STUDENT_PASSWORD     ?? 'Student1234!' };

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await post(`${BASE}/api/auth/local`, { identifier: creds.email, password: creds.password });
  if (!res.body.jwt) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.jwt;
}

// ── token cache ───────────────────────────────────────────────────────────────
let tokens: Record<string, string> = {};

beforeAll(async () => {
  tokens.admin       = await login(ADMIN);
  tokens.instructor  = await login(INSTRUCTOR);
  tokens.instructor2 = await login(INSTRUCTOR2);
  tokens.student     = await login(STUDENT);
}, 15000);

jest.setTimeout(15000);

// ── shared state ──────────────────────────────────────────────────────────────
let courseId:  string;
let course2Id: string;
let lessonId:  string;
let lesson2Id: string;
let lessonNumId:  number;
let lesson2NumId: number;

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Course — Create', () => {
  it('instructor can create a course', async () => {
    const res = await post(api('/courses'), { data: { title: 'Test Course Alpha', description: 'A great course about testing.' } }, tokens.instructor);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Course Alpha');
    expect(res.body.data.status).toBe('draft');
    courseId = res.body.data.documentId;
  });

  it('instructor2 can create their own course', async () => {
    const res = await post(api('/courses'), { data: { title: 'Instructor2 Course', description: 'Owned by instructor2.' } }, tokens.instructor2);
    expect(res.status).toBe(201);
    course2Id = res.body.data.documentId;
  });

  it('student cannot create a course', async () => {
    const res = await post(api('/courses'), { data: { title: 'Student Course', description: 'Should fail.' } }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated user cannot create a course', async () => {
    const res = await post(api('/courses'), { data: { title: 'Anon Course', description: 'Should fail.' } });
    expect([401, 403]).toContain(res.status);
  });

  it('rejects title shorter than 3 characters', async () => {
    const res = await post(api('/courses'), { data: { title: 'AB', description: 'Valid description.' } }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('rejects missing description', async () => {
    const res = await post(api('/courses'), { data: { title: 'Valid Title' } }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('rejects invalid status value', async () => {
    const res = await post(api('/courses'), { data: { title: 'Valid Title', description: 'Valid.', status: 'active' } }, tokens.instructor);
    expect(res.status).toBe(400);
  });
});

describe('Course — Read', () => {
  it('public can list only published courses', async () => {
    const res = await get(api('/courses'));
    expect(res.status).toBe(200);
    const statuses = (res.body.data ?? []).map((c: any) => c.status);
    expect(statuses.every((s: string) => s === 'published')).toBe(true);
  });

  it('public cannot see draft course by ID', async () => {
    const res = await get(api(`/courses/${courseId}`));
    expect(res.status).toBe(404);
  });

  it('instructor can see their own draft course', async () => {
    const res = await get(api(`/courses/${courseId}`), tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(courseId);
  });

  it("instructor cannot see another instructor's draft course", async () => {
    const res = await get(api(`/courses/${course2Id}`), tokens.instructor);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent course', async () => {
    const res = await get(api('/courses/999999'));
    expect(res.status).toBe(404);
  });
});

describe('Course — Update', () => {
  it('instructor can update their own course', async () => {
    const res = await put(api(`/courses/${courseId}`), { data: { title: 'Test Course Alpha Updated' } }, tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Test Course Alpha Updated');
  });

  it("instructor cannot update another instructor's course", async () => {
    const res = await put(api(`/courses/${course2Id}`), { data: { title: 'Hijacked' } }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot update a course', async () => {
    const res = await put(api(`/courses/${courseId}`), { data: { title: 'Student Update' } }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('rejects empty description on update', async () => {
    const res = await put(api(`/courses/${courseId}`), { data: { description: '   ' } }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('instructor cannot reassign course to another instructor', async () => {
    const res = await put(api(`/courses/${courseId}`), { data: { instructor: 9999 } }, tokens.instructor);
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data.instructor?.id).not.toBe(9999);
    }
  });
});

describe('Course — Publish / Unpublish', () => {
  it('instructor can publish their own course', async () => {
    const res = await patch(api(`/courses/${courseId}/publish`), {}, tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
  });

  it('publishing an already-published course returns 409', async () => {
    const res = await patch(api(`/courses/${courseId}/publish`), {}, tokens.instructor);
    expect(res.status).toBe(409);
  });

  it('student cannot publish a course', async () => {
    const res = await patch(api(`/courses/${courseId}/publish`), {}, tokens.student);
    expect(res.status).toBe(403);
  });

  it('instructor can unpublish their own course', async () => {
    const res = await patch(api(`/courses/${courseId}/unpublish`), {}, tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
  });

  it('unpublishing an already-draft course returns 409', async () => {
    const res = await patch(api(`/courses/${courseId}/unpublish`), {}, tokens.instructor);
    expect(res.status).toBe(409);
  });

  it("instructor cannot publish another instructor's course", async () => {
    const res = await patch(api(`/courses/${course2Id}/publish`), {}, tokens.instructor);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Lesson — Create', () => {
  it('instructor can create a lesson in their course', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Lesson One', content: 'Intro content.', course: courseId } }, tokens.instructor);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.order).toBe(1);
    lessonId = res.body.data.documentId;
    lessonNumId = res.body.data.id;
  });

  it('second lesson gets order 2 automatically', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Lesson Two', videoUrl: 'https://example.com/video.mp4', course: courseId } }, tokens.instructor);
    expect(res.status).toBe(201);
    expect(res.body.data.order).toBe(2);
    lesson2Id = res.body.data.documentId;
    lesson2NumId = res.body.data.id;
  });

  it('lesson with explicit order inserts and shifts others', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Inserted Lesson', content: 'Inserted at order 1.', order: 1, course: courseId } }, tokens.instructor);
    expect(res.status).toBe(201);
    expect(res.body.data.order).toBe(1);

    const check = await get(api(`/lessons/${lessonId}`), tokens.instructor);
    expect(check.body.data.order).toBe(2);

    await del(api(`/lessons/${res.body.data.documentId}`), tokens.instructor);
  });

  it("instructor cannot create a lesson in another instructor's course", async () => {
    const res = await post(api('/lessons'), { data: { title: 'Hijack Lesson', content: 'Bad.', course: course2Id } }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot create a lesson', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Student Lesson', content: 'Bad.', course: courseId } }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('rejects lesson with no content and no videoUrl', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Empty Lesson', course: courseId } }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('rejects lesson with invalid order (0)', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Bad Order', content: 'x', order: 0, course: courseId } }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('rejects lesson for non-existent course', async () => {
    const res = await post(api('/lessons'), { data: { title: 'Ghost Lesson', content: 'x', course: 999999 } }, tokens.instructor);
    expect(res.status).toBe(404);
  });
});

describe('Lesson — Read', () => {
  it('unauthenticated user cannot list lessons', async () => {
    const res = await get(api(`/lessons?filters[course]=${courseId}`));
    expect([401, 403]).toContain(res.status);
  });

  it('student not enrolled cannot access lessons', async () => {
    const res = await get(api(`/lessons?filters[course]=${courseId}`), tokens.student);
    expect(res.status).toBe(403);
  });

  it('instructor can list lessons for their course', async () => {
    const res = await get(api(`/lessons?filters[course]=${courseId}`), tokens.instructor);
    expect(res.status).toBe(200);
    const orders = res.body.data.map((l: any) => l.order);
    expect(orders).toEqual([...orders].sort((a: number, b: number) => a - b));
  });

  it('requires course filter', async () => {
    const res = await get(api('/lessons'), tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent lesson', async () => {
    const res = await get(api('/lessons/999999'), tokens.instructor);
    expect(res.status).toBe(404);
  });

  it("instructor cannot access lessons of another instructor's course", async () => {
    const createRes = await post(api('/lessons'), { data: { title: 'Course2 Lesson', content: 'x', course: course2Id } }, tokens.instructor2);
    const c2LessonId = createRes.body.data?.documentId;

    const res = await get(api(`/lessons/${c2LessonId}`), tokens.instructor);
    expect(res.status).toBe(403);

    if (c2LessonId) await del(api(`/lessons/${c2LessonId}`), tokens.instructor2);
  });
});

describe('Lesson — Update', () => {
  it('instructor can update their own lesson', async () => {
    const res = await put(api(`/lessons/${lessonId}`), { data: { title: 'Lesson One Updated' } }, tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Lesson One Updated');
  });

  it("instructor cannot update a lesson in another instructor's course", async () => {
    const createRes = await post(api('/lessons'), { data: { title: 'Course2 Lesson', content: 'x', course: course2Id } }, tokens.instructor2);
    const c2LessonId = createRes.body.data?.documentId;

    const res = await put(api(`/lessons/${c2LessonId}`), { data: { title: 'Hijacked' } }, tokens.instructor);
    expect(res.status).toBe(403);

    if (c2LessonId) await del(api(`/lessons/${c2LessonId}`), tokens.instructor2);
  });

  it('student cannot update a lesson', async () => {
    const res = await put(api(`/lessons/${lessonId}`), { data: { title: 'Student Update' } }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('cannot move lesson to a different course', async () => {
    const res = await put(api(`/lessons/${lessonId}`), { data: { course: course2Id } }, tokens.instructor);
    if (res.status === 200) {
      expect(res.body.data.course?.id).toBe(courseId);
    }
  });

  it('rejects invalid order on update', async () => {
    const res = await put(api(`/lessons/${lessonId}`), { data: { order: -1 } }, tokens.instructor);
    expect(res.status).toBe(400);
  });
});

describe('Lesson — Reorder', () => {
  it('instructor can reorder lessons in their course', async () => {
    const res = await patch(api(`/courses/${courseId}/lessons/reorder`), { orderedIds: [lesson2NumId, lessonNumId] }, tokens.instructor);
    expect(res.status).toBe(200);
    const lessons = res.body.data;
    expect(lessons[0].id).toBe(lesson2NumId);
    expect(lessons[0].order).toBe(1);
    expect(lessons[1].id).toBe(lessonNumId);
    expect(lessons[1].order).toBe(2);
  });

  it('rejects reorder with missing lessons', async () => {
    const res = await patch(api(`/courses/${courseId}/lessons/reorder`), { orderedIds: [lessonNumId] }, tokens.instructor);
    expect(res.status).toBe(400);
  });

  it('rejects reorder with lesson from another course', async () => {
    const createRes = await post(api('/lessons'), { data: { title: 'Foreign Lesson', content: 'x', course: course2Id } }, tokens.instructor2);
    const foreignId = createRes.body.data?.id;

    const res = await patch(api(`/courses/${courseId}/lessons/reorder`), { orderedIds: [lessonNumId, lesson2NumId, foreignId] }, tokens.instructor);
    expect(res.status).toBe(400);

    if (foreignId) await del(api(`/lessons/${createRes.body.data?.documentId}`), tokens.instructor2);
  });

  it('student cannot reorder lessons', async () => {
    const res = await patch(api(`/courses/${courseId}/lessons/reorder`), { orderedIds: [lessonNumId, lesson2NumId] }, tokens.student);
    expect(res.status).toBe(403);
  });

  it("instructor cannot reorder lessons in another instructor's course", async () => {
    const res = await patch(api(`/courses/${course2Id}/lessons/reorder`), { orderedIds: [999999] }, tokens.instructor);
    expect(res.status).toBe(403);
  });
});

describe('Lesson — Delete', () => {
  it('instructor can delete their own lesson', async () => {
    const res = await del(api(`/lessons/${lesson2Id}`), tokens.instructor);
    expect(res.status).toBe(200);
  });

  it('remaining lessons are compacted after delete', async () => {
    const res = await get(api(`/lessons?filters[course]=${courseId}`), tokens.instructor);
    const orders = res.body.data.map((l: any) => l.order);
    expect(orders).toEqual([1]);
  });

  it('student cannot delete a lesson', async () => {
    const res = await del(api(`/lessons/${lessonId}`), tokens.student);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent lesson', async () => {
    const res = await del(api('/lessons/999999'), tokens.instructor);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Course — Delete', () => {
  it("instructor cannot delete another instructor's course", async () => {
    const res = await del(api(`/courses/${course2Id}`), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot delete a course', async () => {
    const res = await del(api(`/courses/${courseId}`), tokens.student);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent course', async () => {
    const res = await del(api('/courses/999999'), tokens.instructor);
    expect(res.status).toBe(404);
  });

  it('instructor can delete their own course (cascades lessons)', async () => {
    const res = await del(api(`/courses/${courseId}`), tokens.instructor);
    expect(res.status).toBe(200);

    const lessonCheck = await get(api(`/lessons/${lessonId}`), tokens.instructor);
    expect(lessonCheck.status).toBe(404);
  });

  it('admin can delete any course', async () => {
    const res = await del(api(`/courses/${course2Id}`), tokens.admin);
    expect(res.status).toBe(200);
  });
});
