import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireEnrollment } from '../../../middlewares/auth';

export default factories.createCoreController('api::quiz-result.quiz-result' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = getAuthUser(ctx);
    const populate = ['student', 'quiz', 'quiz.course'];

    if (isRole(user, 'student')) {
      const results = await strapi.db.query('api::quiz-result.quiz-result').findMany({
        where: { student: user.id },
        populate,
        orderBy: { submittedAt: 'desc' },
        limit: 100,
      });
      return ctx.send({ data: results });
    }

    if (isRole(user, 'instructor')) {
      // Get instructor's course IDs first
      const instructorCourses = await strapi.db.query('api::course.course').findMany({
        where: { instructor: user.id },
        select: ['id'],
      });
      const courseIds = instructorCourses.map((c: any) => c.id);
      if (courseIds.length === 0) return ctx.send({ data: [] });

      const quizzes = await strapi.db.query('api::quiz.quiz').findMany({
        where: { course: { $in: courseIds } },
        select: ['id'],
      });
      const quizIds = quizzes.map((q: any) => q.id);
      if (quizIds.length === 0) return ctx.send({ data: [] });

      const results = await strapi.db.query('api::quiz-result.quiz-result').findMany({
        where: { quiz: { $in: quizIds } },
        populate,
        orderBy: { submittedAt: 'desc' },
        limit: 100,
      });
      return ctx.send({ data: results });
    }

    // admin / content-manager
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = getAuthUser(ctx);
    const result = await strapi.db.query('api::quiz-result.quiz-result').findOne({
      where: { documentId: ctx.params.id },
      populate: ['student', 'quiz', 'quiz.course', 'quiz.course.instructor'],
    });
    if (!result) return ctx.notFound('Quiz result not found');

    if (isRole(user, 'student') && result.student?.id !== user.id) {
      return ctx.forbidden('Forbidden');
    }
    if (isRole(user, 'instructor') && result.quiz?.course?.instructor?.id !== user.id) {
      return ctx.forbidden('Forbidden');
    }
    return ctx.send({ data: result });
  },

  async submit(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student')) {
      return ctx.forbidden('Only students can submit quizzes');
    }

    const { quizId, quizDocumentId, answers } = (ctx.request.body as any) ?? {};
    if (!quizId && !quizDocumentId) return ctx.badRequest('quizId or quizDocumentId is required');
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return ctx.badRequest('answers must be a plain object');

    // Resolve quiz — prefer documentId lookup, fall back to numeric id
    let quiz: any;
    if (quizDocumentId) {
      quiz = await strapi.db.query('api::quiz.quiz').findOne({
        where: { documentId: String(quizDocumentId) },
        populate: ['course'],
      });
    } else {
      const quizNumId = Number(quizId);
      if (!Number.isInteger(quizNumId) || quizNumId < 1) return ctx.badRequest('quizId must be a positive integer');
      quiz = await strapi.db.query('api::quiz.quiz').findOne({
        where: { id: quizNumId },
        populate: ['course'],
      });
    }
    if (!quiz) return ctx.notFound('Quiz not found');

    // Verify enrollment
    try {
      await requireEnrollment(strapi, user.id, quiz.course?.id);
    } catch {
      return ctx.forbidden('Not enrolled in this course');
    }

    try {
      const result = await (strapi.service('api::quiz-result.quiz-result') as any)
        .submitQuiz(user.id, quiz.id, answers);
      ctx.body = { data: result };
    } catch (err: any) {
      if (err.status) return ctx.throw(err.status, err.message);
      throw err;
    }
  },
}));
