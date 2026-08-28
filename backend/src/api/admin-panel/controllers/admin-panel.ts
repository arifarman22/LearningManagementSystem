import { getAuthUser, isRole } from '../../../middlewares/auth';

function requireAdmin(ctx: any) {
  const user = getAuthUser(ctx);
  if (!isRole(user, 'admin')) ctx.throw(403, 'Forbidden: admin only');
  return user;
}

/** Prevent admin from modifying their own account via these endpoints */
function preventSelfModification(ctx: any, targetId: number, action: string) {
  const user = ctx.state?.user;
  if (user && user.id === targetId) {
    ctx.throw(403, `Cannot ${action} your own account`);
  }
}

function svc(strapi: any) {
  return strapi.service('api::admin-panel.admin-panel') as any;
}

export default ({ strapi }: { strapi: any }) => ({

  async listUsers(ctx: any) {
    requireAdmin(ctx);
    const users = await svc(strapi).listUsers();
    ctx.body = { data: users };
  },

  async getUser(ctx: any) {
    requireAdmin(ctx);
    try {
      const user = await svc(strapi).getUser(Number(ctx.params.id));
      ctx.body = { data: user };
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async changeRole(ctx: any) {
    requireAdmin(ctx);
    const targetId = Number(ctx.params.id);
    preventSelfModification(ctx, targetId, 'change the role of');
    const { roleId } = (ctx.request.body as any) ?? {};
    if (!roleId) return ctx.badRequest('roleId is required');
    try {
      const user = await svc(strapi).changeRole(targetId, Number(roleId));
      ctx.body = { data: user };
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async blockUser(ctx: any) {
    requireAdmin(ctx);
    const targetId = Number(ctx.params.id);
    preventSelfModification(ctx, targetId, 'block');
    try {
      const user = await svc(strapi).blockUser(targetId);
      ctx.body = { data: user };
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      if (err.status === 409) return ctx.conflict(err.message);
      throw err;
    }
  },

  async unblockUser(ctx: any) {
    requireAdmin(ctx);
    const targetId = Number(ctx.params.id);
    try {
      const user = await svc(strapi).unblockUser(targetId);
      ctx.body = { data: user };
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      if (err.status === 409) return ctx.conflict(err.message);
      throw err;
    }
  },

  async deleteUser(ctx: any) {
    requireAdmin(ctx);
    const targetId = Number(ctx.params.id);
    preventSelfModification(ctx, targetId, 'delete');
    try {
      await svc(strapi).deleteUser(targetId);
      ctx.body = { message: 'User deleted' };
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async getStats(ctx: any) {
    requireAdmin(ctx);
    const stats = await svc(strapi).getStats();
    ctx.body = { data: stats };
  },

  async listRoles(ctx: any) {
    requireAdmin(ctx);
    const roles = await svc(strapi).listRoles();
    ctx.body = { data: roles };
  },

  async me(ctx: any) {
    const user = ctx.state?.user;
    if (!user) return ctx.unauthorized();
    const full = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['role'],
    });
    if (!full) return ctx.notFound();
    const { password, resetPasswordToken, confirmationToken, ...safe } = full;
    if (safe.role?.type) safe.role.type = safe.role.type.replace(/_/g, '-');
    ctx.body = safe;
  },
});
