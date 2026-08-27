import { factories } from '@strapi/strapi';
import { getAuthUser, isRole, requireEnrollment } from '../../../middlewares/auth';

export default factories.createCoreController('api::lesson-progress.lesson-progress' as any, ({ strapi }) => ({

  async find(ctx) {
    const user = getAuthUser(ctx);
    if (isRole(user, 'student')) {
      ctx.query = { ...ctx.query, filters: { ...((ctx.query as any).filters ?? {}), student: user.id } };
    } else if (isRole(user, 'instructor')) {
      ctx.query = { ...ctx.query, filters: { ...((ctx.query as any).filters ?? {}), course: { instructor: user.id } } };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = getAuthUser(ctx);
    const progress = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: { documentId: ctx.params.id },
      populate: ['student', 'course', 'course.instructor'],
    });
    if (!progress) return ctx.notFound('Progress not found');
    if (isRole(user, 'student') && progress.student?.id !== user.id) return ctx.forbidden('Forbidden');
    if (isRole(user, 'instructor') && progress.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    return ctx.send({ data: progress });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student')) return ctx.forbidden('Only students can mark lessons complete');

    const lessonDocId = (ctx.request.body as any)?.data?.lesson;
    if (!lessonDocId) return ctx.badRequest('lesson is required');

    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { documentId: lessonDocId },
      populate: ['course'],
    });
    if (!lesson) return ctx.notFound('Lesson not found');

    try {
      await requireEnrollment(strapi, user.id, lesson.course?.id);
    } catch {
      return ctx.forbidden('Not enrolled in this course');
    }

    const progress = await (strapi.service('api::lesson-progress.lesson-progress') as any)
      .markComplete(user.id, lesson.id, lesson.course?.id);

    // 200 if idempotent (already existed), 201 if newly created
    const status = progress.createdAt && progress.updatedAt &&
      new Date(progress.updatedAt).getTime() - new Date(progress.createdAt).getTime() < 1000 ? 201 : 200;
    return ctx.send({ data: progress }, status);
  },

  async courseProgress(ctx) {
    const user = getAuthUser(ctx);

    const courseDocId = (ctx.query as any)?.course;
    if (!courseDocId) return ctx.badRequest('course query param is required');

    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: courseDocId },
      populate: ['instructor'],
    });
    if (!course) return ctx.notFound('Course not found');

    let studentId: number;

    if (isRole(user, 'student')) {
      try {
        await requireEnrollment(strapi, user.id, course.id);
      } catch {
        return ctx.forbidden('Not enrolled in this course');
      }
      studentId = user.id;
    } else if (isRole(user, 'instructor')) {
      if (course.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
      const qStudentId = Number((ctx.query as any)?.student);
      if (!qStudentId) return ctx.badRequest('student query param required for instructors');
      studentId = qStudentId;
    } else {
      const qStudentId = Number((ctx.query as any)?.student);
      if (!qStudentId) return ctx.badRequest('student query param required');
      studentId = qStudentId;
    }

    const progress = await (strapi.service('api::lesson-progress.lesson-progress') as any)
      .courseProgress(studentId, course.id);

    return ctx.send(progress);
  },
}));
