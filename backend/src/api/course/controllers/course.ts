import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership } from '../../../middlewares/auth';

export default factories.createCoreController('api::course.course' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state?.user;
    if (!user || isRole(user, 'student')) {
      ctx.query = {
        ...ctx.query,
        filters: { ...((ctx.query as any).filters ?? {}), status: 'published' },
      };
    } else if (isRole(user, 'instructor')) {
      // Instructors see published courses + their own drafts
      // Strapi 5 does not support $or at the top-level query filter via ctx.query,
      // so we fetch manually and return
      const allCourses = await strapi.db.query('api::course.course').findMany({
        where: {
          $or: [
            { status: 'published' },
            { instructor: user.id },
          ],
        },
        populate: ['instructor'],
      });
      return ctx.send({ data: allCourses });
    }
    // admin, content-manager, authenticated see all
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state?.user;
    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: ctx.params.id },
      populate: ['instructor', 'lessons'],
    });
    if (!course) return ctx.notFound('Course not found');

    if (!user || isRole(user, 'student')) {
      if (course.status !== 'published') return ctx.notFound('Course not found');
    } else if (isRole(user, 'instructor')) {
      if (course.status !== 'published' && course.instructor?.id !== user.id) {
        return ctx.notFound('Course not found');
      }
    }

    return ctx.send({ data: course });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'authenticated', 'admin', 'content-manager', 'instructor')) {
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
    if (!isRole(user, 'authenticated', 'admin', 'content-manager', 'instructor')) {
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
    if (!isRole(user, 'authenticated', 'admin', 'content-manager', 'instructor')) {
      return ctx.forbidden('Forbidden');
    }

    const existing = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.id } });
    if (!existing) return ctx.notFound('Course not found');
    const courseId = existing.id;
    if (!isRole(user, 'authenticated', 'admin', 'content-manager')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    await (strapi.service('api::course.course') as any).deleteCourse(courseId);
    return ctx.send({ message: 'Course deleted successfully' });
  },

  async publish(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'authenticated', 'admin', 'content-manager', 'instructor')) {
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
    if (!isRole(user, 'authenticated', 'admin', 'content-manager', 'instructor')) {
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
