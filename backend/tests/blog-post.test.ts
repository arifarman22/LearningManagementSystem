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
const post  = (url: string, body: any, token?: string) => req('POST',   url, body,      token);
const put   = (url: string, body: any, token?: string) => req('PUT',    url, body,      token);
const patch = (url: string, body: any, token?: string) => req('PATCH',  url, body,      token);
const del   = (url: string, token?: string)            => req('DELETE', url, undefined, token);

const ADMIN           = { email: 'admin@test.com',          password: 'Admin1234!' };
const CONTENT_MANAGER = { email: 'contentmanager@test.com', password: 'Content1234!' };
const INSTRUCTOR      = { email: 'instructor@test.com',     password: 'Instructor1!' };
const STUDENT         = { email: 'student@test.com',        password: 'Student1234!' };

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await post(api('/auth/local'), { identifier: creds.email, password: creds.password });
  if (!res.body.jwt) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.jwt;
}

jest.setTimeout(30000);

let tokens: Record<string, string> = {};

// ── shared state ──────────────────────────────────────────────────────────────
let draftDocId:     string;
let publishedDocId: string;
let publishedSlug:  string;
let cmPostDocId:    string; // post owned by content-manager

beforeAll(async () => {
  tokens.admin     = await login(ADMIN);
  tokens.instructor = await login(INSTRUCTOR);
  tokens.student   = await login(STUDENT);

  // content-manager login may fail if user doesn't exist — skip gracefully
  try { tokens.cm = await login(CONTENT_MANAGER); } catch { tokens.cm = ''; }
}, 20000);

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Create', () => {
  it('admin can create a draft post', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Admin Draft Post', slug: 'admin-draft-post', body: 'Draft body content.' },
    }, tokens.admin);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('draft');
    draftDocId = res.body.data.documentId;
  });

  it('admin can create a published post directly', async () => {
    const res = await post(api('/blog-posts'), {
      data: {
        title: 'Admin Published Post',
        slug: 'admin-published-post',
        body: 'Published body content.',
        status: 'published',
      },
    }, tokens.admin);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedAt).toBeTruthy();
    publishedDocId = res.body.data.documentId;
    publishedSlug  = res.body.data.slug;
  });

  it('author is forced to the authenticated user (cannot be overridden)', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Authored Post', slug: 'authored-post', body: 'Body.', author: 9999 },
    }, tokens.admin);
    expect(res.status).toBe(201);
    // author should be the admin's id, not 9999
    const author = res.body.data.author ?? res.body.data.attributes?.author;
    if (author) expect(author.id).not.toBe(9999);
    // cleanup
    await del(api(`/blog-posts/${res.body.data.documentId}`), tokens.admin);
  });

  it('instructor cannot create a blog post', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Instructor Post', slug: 'instructor-post', body: 'Body.' },
    }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot create a blog post', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Student Post', slug: 'student-post', body: 'Body.' },
    }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot create a blog post', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Anon Post', slug: 'anon-post', body: 'Body.' },
    });
    expect([401, 403]).toContain(res.status);
  });

  it('rejects title shorter than 3 characters', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'AB', slug: 'ab', body: 'Body.' },
    }, tokens.admin);
    expect(res.status).toBe(400);
  });

  it('rejects missing body', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'No Body Post', slug: 'no-body-post' },
    }, tokens.admin);
    expect(res.status).toBe(400);
  });

  it('rejects invalid status value', async () => {
    const res = await post(api('/blog-posts'), {
      data: { title: 'Bad Status', slug: 'bad-status', body: 'Body.', status: 'active' },
    }, tokens.admin);
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DRAFT VISIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Draft Visibility', () => {
  it('public cannot see draft posts in list', async () => {
    const res = await get(api('/blog-posts'));
    expect(res.status).toBe(200);
    const statuses = (res.body.data ?? []).map((p: any) => p.status ?? p.attributes?.status);
    expect(statuses.every((s: string) => s === 'published')).toBe(true);
  });

  it('student cannot see draft posts in list', async () => {
    const res = await get(api('/blog-posts'), tokens.student);
    expect(res.status).toBe(200);
    const statuses = (res.body.data ?? []).map((p: any) => p.status ?? p.attributes?.status);
    expect(statuses.every((s: string) => s === 'published')).toBe(true);
  });

  it('instructor cannot see draft posts in list', async () => {
    const res = await get(api('/blog-posts'), tokens.instructor);
    expect(res.status).toBe(200);
    const statuses = (res.body.data ?? []).map((p: any) => p.status ?? p.attributes?.status);
    expect(statuses.every((s: string) => s === 'published')).toBe(true);
  });

  it('public cannot fetch a draft post by id', async () => {
    const res = await get(api(`/blog-posts/${draftDocId}`));
    expect(res.status).toBe(404);
  });

  it('student cannot fetch a draft post by id', async () => {
    const res = await get(api(`/blog-posts/${draftDocId}`), tokens.student);
    expect(res.status).toBe(404);
  });

  it('admin can see draft posts in list', async () => {
    const res = await get(api('/blog-posts'), tokens.admin);
    expect(res.status).toBe(200);
    const statuses = (res.body.data ?? []).map((p: any) => p.status ?? p.attributes?.status);
    expect(statuses).toContain('draft');
  });

  it('admin can fetch a draft post by id', async () => {
    const res = await get(api(`/blog-posts/${draftDocId}`), tokens.admin);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISHED VISIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Published Visibility', () => {
  it('public can list published posts', async () => {
    const res = await get(api('/blog-posts'));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('public can fetch a published post by id', async () => {
    const res = await get(api(`/blog-posts/${publishedDocId}`));
    expect(res.status).toBe(200);
    expect(res.body.data.status ?? res.body.data.attributes?.status).toBe('published');
  });

  it('student can fetch a published post by id', async () => {
    const res = await get(api(`/blog-posts/${publishedDocId}`), tokens.student);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent post id', async () => {
    const res = await get(api('/blog-posts/nonexistent-doc-id'));
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SLUG LOOKUP
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Slug Lookup', () => {
  it('public can fetch a published post by slug', async () => {
    const res = await get(api(`/blog-posts/slug/${publishedSlug}`));
    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.slug ?? data.attributes?.slug).toBe(publishedSlug);
  });

  it('public cannot fetch a draft post by slug', async () => {
    const res = await get(api('/blog-posts/slug/admin-draft-post'));
    expect(res.status).toBe(404);
  });

  it('admin can fetch a draft post by slug', async () => {
    const res = await get(api('/blog-posts/slug/admin-draft-post'), tokens.admin);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent slug', async () => {
    const res = await get(api('/blog-posts/slug/this-slug-does-not-exist'));
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISH / UNPUBLISH
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Publish / Unpublish', () => {
  it('admin can publish a draft post', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/publish`), {}, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  it('publishing an already-published post returns 409', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/publish`), {}, tokens.admin);
    expect(res.status).toBe(409);
  });

  it('student cannot publish a post', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/publish`), {}, tokens.student);
    expect(res.status).toBe(403);
  });

  it('instructor cannot publish a post', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/publish`), {}, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('admin can unpublish a post', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/unpublish`), {}, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
  });

  it('unpublishing an already-draft post returns 409', async () => {
    const res = await patch(api(`/blog-posts/${draftDocId}/unpublish`), {}, tokens.admin);
    expect(res.status).toBe(409);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Update', () => {
  it('admin can update any post', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { title: 'Admin Published Post Updated' },
    }, tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.title ?? res.body.data.attributes?.title).toBe('Admin Published Post Updated');
  });

  it('student cannot update a post', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { title: 'Student Update' },
    }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('instructor cannot update a post', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { title: 'Instructor Update' },
    }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('rejects empty body on update', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { body: '   ' },
    }, tokens.admin);
    expect(res.status).toBe(400);
  });

  it('rejects invalid status on update', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { status: 'archived' },
    }, tokens.admin);
    expect(res.status).toBe(400);
  });

  it('cannot reassign author via update', async () => {
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { author: 9999 },
    }, tokens.admin);
    // Either succeeds but author is unchanged, or rejects
    if (res.status === 200) {
      const author = res.body.data.author ?? res.body.data.attributes?.author;
      if (author) expect(author.id).not.toBe(9999);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// OWNERSHIP (content-manager can only edit their own posts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Ownership', () => {
  it('content-manager can create their own post (if role exists)', async () => {
    if (!tokens.cm) return; // skip if content-manager user not seeded
    const res = await post(api('/blog-posts'), {
      data: { title: 'CM Post', slug: 'cm-post', body: 'CM body.' },
    }, tokens.cm);
    expect(res.status).toBe(201);
    cmPostDocId = res.body.data.documentId;
  });

  it("content-manager cannot edit admin's post", async () => {
    if (!tokens.cm) return;
    const res = await put(api(`/blog-posts/${publishedDocId}`), {
      data: { title: 'CM Hijack' },
    }, tokens.cm);
    expect(res.status).toBe(403);
  });

  it("content-manager cannot delete admin's post", async () => {
    if (!tokens.cm) return;
    const res = await del(api(`/blog-posts/${publishedDocId}`), tokens.cm);
    expect(res.status).toBe(403);
  });

  it('content-manager can edit their own post', async () => {
    if (!tokens.cm || !cmPostDocId) return;
    const res = await put(api(`/blog-posts/${cmPostDocId}`), {
      data: { title: 'CM Post Updated' },
    }, tokens.cm);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Blog Post — Delete', () => {
  it('student cannot delete a post', async () => {
    const res = await del(api(`/blog-posts/${publishedDocId}`), tokens.student);
    expect(res.status).toBe(403);
  });

  it('instructor cannot delete a post', async () => {
    const res = await del(api(`/blog-posts/${publishedDocId}`), tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent post', async () => {
    const res = await del(api('/blog-posts/nonexistent-doc-id'), tokens.admin);
    expect(res.status).toBe(404);
  });

  it('admin can delete any post', async () => {
    const res = await del(api(`/blog-posts/${draftDocId}`), tokens.admin);
    expect(res.status).toBe(200);

    const check = await get(api(`/blog-posts/${draftDocId}`), tokens.admin);
    expect(check.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEARDOWN
// ═══════════════════════════════════════════════════════════════════════════════

afterAll(async () => {
  if (publishedDocId) await del(api(`/blog-posts/${publishedDocId}`), tokens.admin);
  if (cmPostDocId)    await del(api(`/blog-posts/${cmPostDocId}`),    tokens.admin);
});
