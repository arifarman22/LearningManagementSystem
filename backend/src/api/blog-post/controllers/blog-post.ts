import { factories } from '@strapi/strapi';
import { getAuthUser, isRole } from '../../../middlewares/auth';

function canSeeDrafts(user: any): boolean {
  return user && isRole(user, 'admin', 'content-manager');
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
      where: { id: ctx.params.id },
    });
    if (!post) return ctx.notFound('Blog post not found');
    if (post.status !== 'published' && !canSeeDrafts(user)) {
      return ctx.notFound('Blog post not found');
    }
    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager')) return ctx.forbidden('Forbidden');

    // Force author to authenticated user
    (ctx.request.body as any).data = {
      ...(ctx.request.body as any).data,
      author: user.id,
    };

    // Set publishedAt when publishing
    const data = (ctx.request.body as any).data;
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager')) return ctx.forbidden('Forbidden');

    // Set publishedAt when transitioning to published
    const data = (ctx.request.body as any)?.data ?? {};
    if (data.status === 'published') {
      const existing = await strapi.db.query('api::blog-post.blog-post').findOne({
        where: { id: ctx.params.id },
      });
      if (existing && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager')) return ctx.forbidden('Forbidden');
    return super.delete(ctx);
  },
}));
