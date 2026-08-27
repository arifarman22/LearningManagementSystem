export {};

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
const patch = (url: string, body: any, token?: string) => req('PATCH',  url, body,      token);
const del   = (url: string, token?: string)            => req('DELETE', url, undefined, token);
const post  = (url: string, body: any, token?: string) => req('POST',   url, body,      token);

const ADMIN      = { email: 'admin@test.com',      password: 'Admin1234!' };
const INSTRUCTOR = { email: 'instructor@test.com', password: 'Instructor1!' };
const STUDENT    = { email: 'student@test.com',    password: 'Student1234!' };

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await post(api('/auth/local'), { identifier: creds.email, password: creds.password });
  if (!res.body.jwt) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.jwt;
}

jest.setTimeout(30000);

let tokens: Record<string, string> = {};
let studentUserId: number;
let instructorUserId: number;
let studentRoleId: number;
let instructorRoleId: number;
let tempUserId: number; // created for delete test

beforeAll(async () => {
  tokens.admin      = await login(ADMIN);
  tokens.instructor = await login(INSTRUCTOR);
  tokens.student    = await login(STUDENT);
}, 20000);

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Roles', () => {
  it('admin can list roles', async () => {
    const res = await get(api('/admin-panel/roles'), tokens.admin);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Capture role IDs for later tests
    const studentRole = res.body.data.find((r: any) => r.type === 'student');
    const instructorRole = res.body.data.find((r: any) => r.type === 'instructor');
    if (studentRole) studentRoleId = studentRole.id;
    if (instructorRole) instructorRoleId = instructorRole.id;
  });

  it('instructor cannot list roles', async () => {
    const res = await get(api('/admin-panel/roles'), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot list roles', async () => {
    const res = await get(api('/admin-panel/roles'), tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot list roles', async () => {
    const res = await get(api('/admin-panel/roles'));
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER LIST
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — List Users', () => {
  it('admin can list all users', async () => {
    const res = await get(api('/admin-panel/users'), tokens.admin);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Capture user IDs for later tests
    const student    = res.body.data.find((u: any) => u.email === STUDENT.email);
    const instructor = res.body.data.find((u: any) => u.email === INSTRUCTOR.email);
    if (student)    studentUserId    = student.id;
    if (instructor) instructorUserId = instructor.id;

    // Response must not expose password hashes
    for (const u of res.body.data) {
      expect(u).not.toHaveProperty('password');
    }
  });

  it('instructor cannot list users', async () => {
    const res = await get(api('/admin-panel/users'), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot list users', async () => {
    const res = await get(api('/admin-panel/users'), tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot list users', async () => {
    const res = await get(api('/admin-panel/users'));
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET SINGLE USER
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Get User', () => {
  it('admin can inspect a user', async () => {
    expect(studentUserId).toBeTruthy();
    const res = await get(api(`/admin-panel/users/${studentUserId}`), tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(studentUserId);
    expect(res.body.data.email).toBe(STUDENT.email);
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data.role).toBeTruthy();
  });

  it('returns 404 for non-existent user', async () => {
    const res = await get(api('/admin-panel/users/999999'), tokens.admin);
    expect(res.status).toBe(404);
  });

  it('instructor cannot inspect a user', async () => {
    const res = await get(api(`/admin-panel/users/${studentUserId}`), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot inspect another user', async () => {
    const res = await get(api(`/admin-panel/users/${instructorUserId}`), tokens.student);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE ROLE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Change Role', () => {
  it('admin can change a user role', async () => {
    expect(studentUserId).toBeTruthy();
    expect(instructorRoleId).toBeTruthy();

    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: instructorRoleId }, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.role.type).toBe('instructor');
  });

  it('admin can restore the original role', async () => {
    expect(studentRoleId).toBeTruthy();
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: studentRoleId }, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.role.type).toBe('student');
  });

  it('rejects missing roleId', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), {}, tokens.admin);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent role', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: 999999 }, tokens.admin);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent user', async () => {
    const res = await patch(api('/admin-panel/users/999999/role'), { roleId: studentRoleId }, tokens.admin);
    expect(res.status).toBe(404);
  });

  it('instructor cannot change roles', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: instructorRoleId }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot change roles', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: instructorRoleId }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot change roles', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/role`), { roleId: instructorRoleId });
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Block / Unblock', () => {
  it('admin can block a user', async () => {
    expect(studentUserId).toBeTruthy();
    const res = await patch(api(`/admin-panel/users/${studentUserId}/block`), {}, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.blocked).toBe(true);
  });

  it('blocking an already-blocked user returns 409', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/block`), {}, tokens.admin);
    expect(res.status).toBe(409);
  });

  it('instructor cannot block a user', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/block`), {}, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot block a user', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/block`), {}, tokens.student);
    expect(res.status).toBe(403);
  });

  it('admin can unblock a user', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/unblock`), {}, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.blocked).toBe(false);
  });

  it('unblocking a non-blocked user returns 409', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/unblock`), {}, tokens.admin);
    expect(res.status).toBe(409);
  });

  it('instructor cannot unblock a user', async () => {
    const res = await patch(api(`/admin-panel/users/${studentUserId}/unblock`), {}, tokens.instructor);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE USER
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Delete User', () => {
  it('admin can delete a user', async () => {
    // Register a throwaway user to delete
    const reg = await post(api('/auth/local/register'), {
      username: 'throwaway_user',
      email: 'throwaway@test.com',
      password: 'Throwaway1!',
    });
    // May fail if registration is restricted — skip gracefully
    if (reg.status !== 200) return;
    tempUserId = reg.body.user?.id;
    if (!tempUserId) return;

    const res = await del(api(`/admin-panel/users/${tempUserId}`), tokens.admin);
    expect(res.status).toBe(200);

    const check = await get(api(`/admin-panel/users/${tempUserId}`), tokens.admin);
    expect(check.status).toBe(404);
  });

  it('returns 404 when deleting non-existent user', async () => {
    const res = await del(api('/admin-panel/users/999999'), tokens.admin);
    expect(res.status).toBe(404);
  });

  it('instructor cannot delete a user', async () => {
    const res = await del(api(`/admin-panel/users/${studentUserId}`), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot delete a user', async () => {
    const res = await del(api(`/admin-panel/users/${studentUserId}`), tokens.student);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Admin Panel — Statistics', () => {
  it('admin can fetch platform stats', async () => {
    const res = await get(api('/admin-panel/stats'), tokens.admin);
    expect(res.status).toBe(200);

    const { data } = res.body;
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('courses');
    expect(data).toHaveProperty('enrollments');
    expect(data).toHaveProperty('blogPosts');
    expect(data).toHaveProperty('quizzes');
    expect(data).toHaveProperty('lessons');

    expect(typeof data.users.total).toBe('number');
    expect(typeof data.users.byRole).toBe('object');
    expect(typeof data.courses.total).toBe('number');
    expect(typeof data.courses.published).toBe('number');
    expect(typeof data.courses.draft).toBe('number');
    expect(typeof data.enrollments.total).toBe('number');
    expect(typeof data.enrollments.active).toBe('number');
    expect(typeof data.blogPosts.total).toBe('number');
    expect(typeof data.blogPosts.published).toBe('number');
    expect(typeof data.quizzes.total).toBe('number');
    expect(typeof data.lessons.total).toBe('number');

    // Sanity: totals are non-negative
    expect(data.users.total).toBeGreaterThanOrEqual(0);
    expect(data.courses.published + data.courses.draft).toBe(data.courses.total);
  });

  it('stats users.total matches actual user count', async () => {
    const statsRes = await get(api('/admin-panel/stats'), tokens.admin);
    const listRes  = await get(api('/admin-panel/users'), tokens.admin);
    expect(statsRes.body.data.users.total).toBe(listRes.body.data.length);
  });

  it('instructor cannot fetch stats', async () => {
    const res = await get(api('/admin-panel/stats'), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot fetch stats', async () => {
    const res = await get(api('/admin-panel/stats'), tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot fetch stats', async () => {
    const res = await get(api('/admin-panel/stats'));
    expect([401, 403]).toContain(res.status);
  });
});
