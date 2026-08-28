import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership } from '../../../middlewares/auth';

export default factories.createCoreController('api::course.course' as any, ({ strapi }) => ({

  async find(ctx) {
    let user = ctx.state?.user;
    if (!user) {
      const authHeader = ctx.request.headers?.authorization as string | undefined;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = await (strapi.service('plugin::users-permissions.jwt') as any).verify(token);
          if (decoded?.id) {
            user = await strapi.db.query('plugin::users-permissions.user').findOne({
              where: { id: decoded.id },
              populate: ['role'],
            });
          }
        } catch { user = null; }
      }
    }
    const populate = ['instructor', 'lessons'];

    if (!user || isRole(user, 'student')) {
      const courses = await strapi.db.query('api::course.course').findMany({
        where: { status: 'published' },
        populate,
      });
      return ctx.send({ data: courses });
    }

    if (isRole(user, 'instructor')) {
      const courses = await strapi.db.query('api::course.course').findMany({
        where: { instructor: user.id },
        populate,
      });
      return ctx.send({ data: courses });
    }

    // admin, content-manager — return all
    const courses = await strapi.db.query('api::course.course').findMany({ populate });
    return ctx.send({ data: courses });
  },

  async findOne(ctx) {
    let user = ctx.state?.user;
    if (!user) {
      const authHeader = ctx.request.headers?.authorization as string | undefined;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = await (strapi.service('plugin::users-permissions.jwt') as any).verify(token);
          if (decoded?.id) {
            user = await strapi.db.query('plugin::users-permissions.user').findOne({
              where: { id: decoded.id },
              populate: ['role'],
            });
          }
        } catch { user = null; }
      }
    }
    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: ctx.params.id },
      populate: ['instructor', 'lessons'],
    });
    if (!course) return ctx.notFound('Course not found');

    if (!user || isRole(user, 'student')) {
      if (course.status !== 'published') return ctx.notFound('Course not found');
    } else if (isRole(user, 'instructor')) {
      if (course.instructor?.id !== user.id) {
        return ctx.notFound('Course not found');
      }
    }

    return ctx.send({ data: course });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const data = (ctx.request.body as any)?.data;
    if (!data) return ctx.badRequest('data is required');

    const instructorId = isRole(user, 'instructor') ? user.id : (data.instructor ?? undefined);

    try {
      const course = await (strapi.service('api::course.course') as any).createCourse(data, instructorId);
      return ctx.send({ data: course }, 201);
    } catch (err: any) {
      if (err.status === 400) return ctx.badRequest(err.message);
      throw err;
    }
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const courseDoc = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.id } });
    if (!courseDoc) return ctx.notFound('Course not found');
    const courseId = courseDoc.id;
    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    const data = (ctx.request.body as any)?.data;
    if (!data) return ctx.badRequest('data is required');

    // Prevent instructor from reassigning course ownership
    if (isRole(user, 'instructor')) delete data.instructor;

    try {
      const course = await (strapi.service('api::course.course') as any).updateCourse(courseId, data);
      return ctx.send({ data: course });
    } catch (err: any) {
      if (err.status === 400) return ctx.badRequest(err.message);
      throw err;
    }
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const existing = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.id } });
    if (!existing) return ctx.notFound('Course not found');
    const courseId = existing.id;
    if (!isRole(user, 'admin', 'content-manager')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    await (strapi.service('api::course.course') as any).deleteCourse(courseId);
    return ctx.send({ message: 'Course deleted successfully' });
  },

  async publish(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const courseDoc = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.id } });
    if (!courseDoc) return ctx.notFound('Course not found');
    const courseId = courseDoc.id;
    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    try {
      const course = await (strapi.service('api::course.course') as any).publishCourse(courseId);
      return ctx.send({ data: course });
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      if (err.status === 409) return ctx.conflict(err.message);
      throw err;
    }
  },

  async unpublish(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const courseDoc = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.id } });
    if (!courseDoc) return ctx.notFound('Course not found');
    const courseId = courseDoc.id;
    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    try {
      const course = await (strapi.service('api::course.course') as any).unpublishCourse(courseId);
      return ctx.send({ data: course });
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      if (err.status === 409) return ctx.conflict(err.message);
      throw err;
    }
  },
}));
