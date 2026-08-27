import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership, requireEnrollment } from '../../../middlewares/auth';

async function getQuizCourse(strapi: any, quizDocId: string, ctx: any) {
  const quiz = await strapi.db.query('api::quiz.quiz').findOne({
    where: { documentId: quizDocId },
    populate: ['course', 'course.instructor'],
  });
  if (!quiz) ctx.throw(404, 'Quiz not found');
  return quiz;
}

export default factories.createCoreController('api::question.question' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = getAuthUser(ctx);
    const quizDocId = (ctx.query as any)?.filters?.quiz;
    if (!quizDocId) return ctx.badRequest('quiz filter required');

    const quiz = await getQuizCourse(strapi, String(quizDocId), ctx);

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, quiz.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = getAuthUser(ctx);
    const question = await strapi.db.query('api::question.question').findOne({
      where: { documentId: ctx.params.id },
      populate: ['quiz', 'quiz.course', 'quiz.course.instructor'],
    });
    if (!question) return ctx.notFound('Question not found');

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, question.quiz?.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (question.quiz?.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }
    return ctx.send({ data: question });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    const quizDocId = (ctx.request.body as any)?.data?.quiz;
    if (!quizDocId) return ctx.badRequest('quiz is required');

    if (isRole(user, 'instructor')) {
      const quiz = await getQuizCourse(strapi, String(quizDocId), ctx);
      await requireCourseOwnership(strapi, quiz.course?.id, user.id, ctx);
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const question = await strapi.db.query('api::question.question').findOne({
        where: { documentId: ctx.params.id },
        populate: ['quiz', 'quiz.course', 'quiz.course.instructor'],
      });
      if (!question) return ctx.notFound('Question not found');
      await requireCourseOwnership(strapi, question.quiz?.course?.id, user.id, ctx);
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const question = await strapi.db.query('api::question.question').findOne({
        where: { documentId: ctx.params.id },
        populate: ['quiz', 'quiz.course', 'quiz.course.instructor'],
      });
      if (!question) return ctx.notFound('Question not found');
      await requireCourseOwnership(strapi, question.quiz?.course?.id, user.id, ctx);
    }
    return super.delete(ctx);
  },
}));
