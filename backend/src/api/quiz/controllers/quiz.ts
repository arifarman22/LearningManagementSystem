import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership, requireEnrollment } from '../../../middlewares/auth';

async function getQuizWithCourse(strapi: any, documentId: string, ctx: any) {
  const quiz = await strapi.db.query('api::quiz.quiz').findOne({
    where: { documentId },
    populate: ['course', 'course.instructor'],
  });
  if (!quiz) ctx.throw(404, 'Quiz not found');
  return quiz;
}

/** Remove isCorrect from every option nested inside a quiz response */
function stripCorrectAnswers(data: any): any {
  if (!data) return data;
  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    const questions = item.questions ?? item.attributes?.questions?.data ?? [];
    for (const q of questions) {
      const options = q.options ?? q.attributes?.options?.data ?? [];
      for (const opt of options) {
        const attrs = opt.attributes ?? opt;
        delete attrs.isCorrect;
      }
    }
  }
  return data;
}

export default factories.createCoreController('api::quiz.quiz' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state?.user;

    if (!user) {
      // Unauthenticated: return empty list
      return ctx.send({ data: [] });
    }

    const courseDocId = (ctx.query as any)?.filters?.course?.documentId?.$eq
      ?? (ctx.query as any)?.filters?.course;
    if (isRole(user, 'student')) {
      if (!courseDocId) return ctx.badRequest('course filter required');
      // Resolve documentId to numeric id for enrollment check
      const course = await strapi.db.query('api::course.course').findOne({
        where: { documentId: String(courseDocId) },
      });
      if (!course) return ctx.notFound('Course not found');
      try {
        await requireEnrollment(strapi, user.id, course.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (!courseDocId) return ctx.badRequest('course filter required');
      const course = await strapi.db.query('api::course.course').findOne({
        where: { documentId: String(courseDocId) },
        populate: ['instructor'],
      });
      if (!course) return ctx.notFound('Course not found');
      if (course.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }
    const result = await super.find(ctx);
    if (isRole(user, 'student')) stripCorrectAnswers((result as any)?.data);
    return result;
  },

  async findOne(ctx) {
    const user = ctx.state?.user;
    if (!user) return ctx.unauthorized('Authentication required');

    const quiz = await getQuizWithCourse(strapi, ctx.params.id, ctx);

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, quiz.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (quiz.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }
    const result = await super.findOne(ctx);
    if (isRole(user, 'student')) stripCorrectAnswers((result as any)?.data);
    return result;
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    const courseDocId = (ctx.request.body as any)?.data?.course;
    if (!courseDocId) return ctx.badRequest('course is required');

    if (isRole(user, 'instructor')) {
      const course = await strapi.db.query('api::course.course').findOne({
        where: { documentId: String(courseDocId) },
        populate: ['instructor'],
      });
      if (!course) return ctx.notFound('Course not found');
      if (course.instructor?.id !== user.id) return ctx.forbidden('Forbidden: you do not own this course');
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const quiz = await getQuizWithCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const quiz = await getQuizWithCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.delete(ctx);
  },
}));
