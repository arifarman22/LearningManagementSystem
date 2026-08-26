import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireEnrollment } from '../../../middlewares/auth';

export default factories.createCoreController('api::quiz-result.quiz-result' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = getAuthUser(ctx);

    if (isRole(user, 'student')) {
      ctx.query = {
        ...ctx.query,
        filters: { ...((ctx.query as any).filters ?? {}), student: user.id },
      };
    } else if (isRole(user, 'instructor')) {
      ctx.query = {
        ...ctx.query,
        filters: {
          ...((ctx.query as any).filters ?? {}),
          quiz: { course: { instructor: user.id } },
        },
      };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = getAuthUser(ctx);
    const result = await strapi.db.query('api::quiz-result.quiz-result').findOne({
      where: { id: ctx.params.id },
      populate: ['student', 'quiz', 'quiz.course', 'quiz.course.instructor'],
    });
    if (!result) return ctx.notFound('Quiz result not found');

    if (isRole(user, 'student') && result.student?.id !== user.id) {
      return ctx.forbidden('Forbidden');
    }
    if (isRole(user, 'instructor') && result.quiz?.course?.instructor?.id !== user.id) {
      return ctx.forbidden('Forbidden');
    }
    return super.findOne(ctx);
  },

  async submit(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student')) {
      return ctx.forbidden('Only students can submit quizzes');
    }

    const { quizId, answers } = (ctx.request.body as any) ?? {};
    if (!quizId) return ctx.badRequest('quizId is required');
    if (!answers || typeof answers !== 'object') return ctx.badRequest('answers must be an object');

    // Verify quiz exists and get its course
    const quiz = await strapi.db.query('api::quiz.quiz').findOne({
      where: { id: quizId },
      populate: ['course'],
    });
    if (!quiz) return ctx.notFound('Quiz not found');

    // Verify enrollment
    try {
      await requireEnrollment(strapi, user.id, quiz.course?.id);
    } catch {
      return ctx.forbidden('Not enrolled in this course');
    }

    try {
      const result = await (strapi.service('api::quiz-result.quiz-result') as any)
        .submitQuiz(user.id, Number(quizId), answers);
      ctx.body = { data: result };
    } catch (err: any) {
      if (err.status) return ctx.throw(err.status, err.message);
      throw err;
    }
  },
}));
