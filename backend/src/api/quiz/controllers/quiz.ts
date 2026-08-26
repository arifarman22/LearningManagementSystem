import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership, requireEnrollment } from '../../../middlewares/auth';

async function getQuizWithCourse(strapi: any, quizId: number, ctx: any) {
  const quiz = await strapi.db.query('api::quiz.quiz').findOne({
    where: { id: quizId },
    populate: ['course', 'course.instructor'],
  });
  if (!quiz) ctx.throw(404, 'Quiz not found');
  return quiz;
}

export default factories.createCoreController('api::quiz.quiz' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state?.user;
    const courseId = (ctx.query as any)?.filters?.course;

    if (!user) return ctx.unauthorized('Authentication required');

    if (isRole(user, 'student')) {
      if (!courseId) return ctx.badRequest('course filter required');
      try {
        await requireEnrollment(strapi, user.id, Number(courseId));
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor') && courseId) {
      await requireCourseOwnership(strapi, Number(courseId), user.id, ctx);
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state?.user;
    if (!user) return ctx.unauthorized('Authentication required');

    const quiz = await getQuizWithCourse(strapi, Number(ctx.params.id), ctx);

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, quiz.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (quiz.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }
    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    const courseId = (ctx.request.body as any)?.data?.course;
    if (!courseId) return ctx.badRequest('course is required');

    if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, Number(courseId), user.id, ctx);
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const quiz = await getQuizWithCourse(strapi, Number(ctx.params.id), ctx);
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const quiz = await getQuizWithCourse(strapi, Number(ctx.params.id), ctx);
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.delete(ctx);
  },
}));
