import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership, requireEnrollment } from '../../../middlewares/auth';

const MANAGERS = ['authenticated', 'admin', 'content-manager', 'instructor'] as const;

async function getLessonWithCourse(strapi: any, lessonId: string, ctx: any) {
  const lesson = await strapi.db.query('api::lesson.lesson').findOne({
    where: { documentId: lessonId },
    populate: ['course', 'course.instructor'],
  });
  if (!lesson) ctx.throw(404, 'Lesson not found');
  return lesson;
}

export default factories.createCoreController('api::lesson.lesson' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state?.user;
    const courseDocId = (ctx.query as any)?.filters?.course;

    if (!user) return ctx.unauthorized('Authentication required');
    if (!courseDocId) return ctx.badRequest('course filter is required');

    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: courseDocId },
      populate: ['instructor'],
    });
    if (!course) return ctx.notFound('Course not found');

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, course.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (course.status !== 'published' && course.instructor?.id !== user.id) {
        return ctx.forbidden('Forbidden');
      }
    }

    // Replace documentId filter with numeric id for Strapi's query engine
    const filters = { ...((ctx.query as any).filters ?? {}), course: course.id };
    ctx.query = { ...ctx.query, filters, sort: 'order:asc' };
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state?.user;
    if (!user) return ctx.unauthorized('Authentication required');

    const lesson = await getLessonWithCourse(strapi, ctx.params.id, ctx);

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, lesson.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (lesson.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }

    return ctx.send({ data: lesson });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, ...MANAGERS)) return ctx.forbidden('Forbidden');

    const data = (ctx.request.body as any)?.data;
    if (!data) return ctx.badRequest('data is required');

    const courseDocId = data.course;
    if (!courseDocId) return ctx.badRequest('course is required');

    const courseDoc = await strapi.db.query('api::course.course').findOne({ where: { documentId: courseDocId } });
    if (!courseDoc) return ctx.notFound('Course not found');
    const numericCourseId = courseDoc.id;

    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, numericCourseId, user.id, ctx);
    }

    try {
      const lesson = await (strapi.service('api::lesson.lesson') as any).createLesson({ ...data, course: numericCourseId });
      return ctx.send({ data: lesson }, 201);
    } catch (err: any) {
      if (err.status === 400) return ctx.badRequest(err.message);
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, ...MANAGERS)) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const lesson = await getLessonWithCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, lesson.course?.id, user.id, ctx);
    }

    const lessonDoc = await strapi.db.query('api::lesson.lesson').findOne({ where: { documentId: ctx.params.id } });
    if (!lessonDoc) return ctx.notFound('Lesson not found');
    const lessonId = lessonDoc.id;

    const data = (ctx.request.body as any)?.data;
    if (!data) return ctx.badRequest('data is required');

    delete data.course;

    try {
      const lesson = await (strapi.service('api::lesson.lesson') as any).updateLesson(lessonId, data);
      return ctx.send({ data: lesson });
    } catch (err: any) {
      if (err.status === 400) return ctx.badRequest(err.message);
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, ...MANAGERS)) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const lesson = await getLessonWithCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, lesson.course?.id, user.id, ctx);
    }

    const lessonDoc = await strapi.db.query('api::lesson.lesson').findOne({ where: { documentId: ctx.params.id } });
    if (!lessonDoc) return ctx.notFound('Lesson not found');
    const lessonId = lessonDoc.id;

    try {
      await (strapi.service('api::lesson.lesson') as any).deleteLesson(lessonId);
      return ctx.send({ message: 'Lesson deleted successfully' });
    } catch (err: any) {
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },

  async reorder(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, ...MANAGERS)) return ctx.forbidden('Forbidden');

    const courseDoc = await strapi.db.query('api::course.course').findOne({ where: { documentId: ctx.params.courseId } });
    if (!courseDoc) return ctx.notFound('Course not found');
    const courseId = courseDoc.id;

    // Ownership check before payload validation so 403 takes priority over 400
    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, courseId, user.id, ctx);
    }

    const { orderedIds } = (ctx.request.body as any) ?? {};
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return ctx.badRequest('orderedIds must be a non-empty array');
    }

    try {
      const lessons = await (strapi.service('api::lesson.lesson') as any).reorderLessons(courseId, orderedIds);
      return ctx.send({ data: lessons });
    } catch (err: any) {
      if (err.status === 400) return ctx.badRequest(err.message);
      if (err.status === 404) return ctx.notFound(err.message);
      throw err;
    }
  },
}));
