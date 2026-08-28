import { factories } from '@strapi/strapi';
import { getAuthUser, isRole } from '../../../middlewares/auth';

function canSeeDrafts(user: any): boolean {
  return user && isRole(user, 'admin', 'content-manager');
}

function canManage(user: any): boolean {
  return isRole(user, 'admin', 'content-manager');
}

/** Content-managers can only edit their own posts; admins can edit any. */
async function assertEditAccess(strapi: any, user: any, postId: string, ctx: any) {
  if (isRole(user, 'admin')) return;
  const post = await strapi.db.query('api::blog-post.blog-post').findOne({
    where: { documentId: postId },
    populate: ['author'],
  });
  if (!post) ctx.throw(404, 'Blog post not found');
  if (post.author?.id !== user.id) ctx.throw(403, 'Forbidden');
}

/** Strip internal/private fields from a post object before returning to public. */
function sanitizePost(post: any) {
  if (!post) return post;
  const { author, ...safe } = post;
  return {
    ...safe,
    author: author ? { id: author.id, username: author.username } : null,
  };
}

export default factories.createCoreController('api::blog-post.blog-post' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state?.user;
    if (!canSeeDrafts(user)) {
      ctx.query = {
        ...ctx.query,
        filters: { ...((ctx.query as any).filters ?? {}), status: 'published' },
      };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state?.user;
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { documentId: ctx.params.id },
    });
    if (!post) return ctx.notFound('Blog post not found');
    if (post.status !== 'published' && !canSeeDrafts(user)) {
      return ctx.notFound('Blog post not found');
    }
    return super.findOne(ctx);
  },

  async getBySlug(ctx) {
    const user = ctx.state?.user;
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { slug: ctx.params.slug },
      populate: ['author', 'coverImage'],
    });
    if (!post) return ctx.notFound('Blog post not found');
    if (post.status !== 'published' && !canSeeDrafts(user)) {
      return ctx.notFound('Blog post not found');
    }
    ctx.body = { data: sanitizePost(post) };
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!canManage(user)) return ctx.forbidden('Forbidden');

    const data = (ctx.request.body as any).data ?? {};

    // Validate required fields
    if (!data.title || String(data.title).trim().length < 3) {
      return ctx.badRequest('title must be at least 3 characters');
    }
    if (!data.body || String(data.body).trim().length === 0) {
      return ctx.badRequest('body is required');
    }

    // Force author to the authenticated user; ignore any client-supplied author
    data.author = { connect: [{ id: user.id }] };
    (ctx.request.body as any).data = data;

    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!canManage(user)) return ctx.forbidden('Forbidden');

    await assertEditAccess(strapi, user, ctx.params.id, ctx);

    const data = (ctx.request.body as any)?.data ?? {};

    // Prevent reassigning author
    delete data.author;

    // Validate fields if provided
    if (data.title !== undefined && String(data.title).trim().length < 3) {
      return ctx.badRequest('title must be at least 3 characters');
    }
    if (data.body !== undefined && String(data.body).trim().length === 0) {
      return ctx.badRequest('body is required');
    }
    if (data.status !== undefined && !['draft', 'published'].includes(data.status)) {
      return ctx.badRequest('status must be draft or published');
    }

    // Set publishedAt when transitioning to published
    if (data.status === 'published') {
      const existing = await strapi.db.query('api::blog-post.blog-post').findOne({
        where: { documentId: ctx.params.id },
      });
      if (existing && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    return super.update(ctx);
  },

  async publish(ctx) {
    const user = getAuthUser(ctx);
    if (!canManage(user)) return ctx.forbidden('Forbidden');

    await assertEditAccess(strapi, user, ctx.params.id, ctx);

    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { documentId: ctx.params.id },
    });
    if (!post) return ctx.notFound('Blog post not found');
    if (post.status === 'published') return ctx.conflict('Already published');

    const updated = await strapi.db.query('api::blog-post.blog-post').update({
      where: { documentId: ctx.params.id },
      data: { status: 'published', publishedAt: post.publishedAt ?? new Date() },
    });
    ctx.body = { data: updated };
  },

  async unpublish(ctx) {
    const user = getAuthUser(ctx);
    if (!canManage(user)) return ctx.forbidden('Forbidden');

    await assertEditAccess(strapi, user, ctx.params.id, ctx);

    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { documentId: ctx.params.id },
    });
    if (!post) return ctx.notFound('Blog post not found');
    if (post.status === 'draft') return ctx.conflict('Already a draft');

    const updated = await strapi.db.query('api::blog-post.blog-post').update({
      where: { documentId: ctx.params.id },
      data: { status: 'draft' },
    });
    ctx.body = { data: updated };
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!canManage(user)) return ctx.forbidden('Forbidden');

    await assertEditAccess(strapi, user, ctx.params.id, ctx);

    return super.delete(ctx);
  },
}));
