import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireCourseOwnership, requireEnrollment } from '../../../middlewares/auth';

function stripCorrectAnswer(option: any) {
  const { isCorrect: _removed, ...safe } = option;
  return safe;
}

async function getOptionCourse(strapi: any, documentId: string, ctx: any) {
  const option = await strapi.db.query('api::option.option').findOne({
    where: { documentId },
    populate: ['question', 'question.quiz', 'question.quiz.course', 'question.quiz.course.instructor'],
  });
  if (!option) ctx.throw(404, 'Option not found');
  return option;
}

export default factories.createCoreController('api::option.option' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = getAuthUser(ctx);
    const questionDocId = (ctx.query as any)?.filters?.question;
    if (!questionDocId) return ctx.badRequest('question filter required');

    const question = await strapi.db.query('api::question.question').findOne({
      where: { documentId: String(questionDocId) },
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
      await requireCourseOwnership(strapi, question.quiz?.course?.id, user.id, ctx);
    }

    const result = await super.find(ctx);

    // Strip isCorrect for students
    if (isRole(user, 'student')) {
      if (Array.isArray((result as any)?.data)) {
        (result as any).data = (result as any).data.map((item: any) => ({
          ...item,
          attributes: stripCorrectAnswer(item.attributes ?? item),
        }));
      }
    }
    return result;
  },

  async findOne(ctx) {
    const user = getAuthUser(ctx);
    const option = await getOptionCourse(strapi, ctx.params.id, ctx);

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, option.question?.quiz?.course?.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
    } else if (isRole(user, 'instructor')) {
      if (option.question?.quiz?.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    }

    if (isRole(user, 'student')) {
      return ctx.send({ data: stripCorrectAnswer(option) });
    }
    return ctx.send({ data: option });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const questionDocId = (ctx.request.body as any)?.data?.question;
      if (!questionDocId) return ctx.badRequest('question is required');
      const question = await strapi.db.query('api::question.question').findOne({
        where: { documentId: String(questionDocId) },
        populate: ['quiz', 'quiz.course'],
      });
      if (!question) return ctx.notFound('Question not found');
      await requireCourseOwnership(strapi, question.quiz?.course?.id, user.id, ctx);
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const option = await getOptionCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, option.question?.quiz?.course?.id, user.id, ctx);
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'admin', 'content-manager', 'instructor')) return ctx.forbidden('Forbidden');

    if (isRole(user, 'instructor')) {
      const option = await getOptionCourse(strapi, ctx.params.id, ctx);
      await requireCourseOwnership(strapi, option.question?.quiz?.course?.id, user.id, ctx);
    }
    return super.delete(ctx);
  },
}));
