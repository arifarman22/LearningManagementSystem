import { factories } from '@strapi/strapi';
import { getAuthUser, isRole } from '../../../middlewares/auth';

export default factories.createCoreController('api::enrollment.enrollment' as any, ({ strapi }) => ({

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
    const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { documentId: ctx.params.id },
      populate: ['student', 'course', 'course.instructor'],
    });
    if (!enrollment) return ctx.notFound('Enrollment not found');
    if (isRole(user, 'student') && enrollment.student?.id !== user.id) return ctx.forbidden('Forbidden');
    if (isRole(user, 'instructor') && enrollment.course?.instructor?.id !== user.id) return ctx.forbidden('Forbidden');
    return ctx.send({ data: enrollment });
  },

  async create(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student', 'admin')) return ctx.forbidden('Forbidden');

    const courseDocId = (ctx.request.body as any)?.data?.course;
    if (!courseDocId) return ctx.badRequest('course is required');

    const course = await strapi.db.query('api::course.course').findOne({ where: { documentId: courseDocId } });
    if (!course) return ctx.notFound('Course not found');
    if (course.status !== 'published') return ctx.badRequest('Course is not available for enrollment');

    const studentId = isRole(user, 'student') ? user.id : ((ctx.request.body as any)?.data?.student ?? user.id);

    try {
      const enrollment = await (strapi.service('api::enrollment.enrollment') as any).enrollStudent(studentId, course.id);
      return ctx.send({ data: enrollment }, 201);
    } catch (err: any) {
      if (err.status === 409) return ctx.conflict(err.message);
      throw err;
    }
  },

  async delete(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student', 'admin')) return ctx.forbidden('Forbidden');

    const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { documentId: ctx.params.id },
      populate: ['student'],
    });
    if (!enrollment) return ctx.notFound('Enrollment not found');
    if (isRole(user, 'student') && enrollment.student?.id !== user.id) return ctx.forbidden('Forbidden');

    await strapi.db.query('api::enrollment.enrollment').delete({ where: { id: enrollment.id } });
    return ctx.send({ message: 'Unenrolled successfully' });
  },

  async myCourses(ctx) {
    const user = getAuthUser(ctx);
    if (!isRole(user, 'student')) return ctx.forbidden('Only students can access my-courses');

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: { student: user.id, status: 'active' },
      populate: ['course', 'course.instructor', 'course.lessons', 'course.thumbnail'],
    });

    return ctx.send({ data: enrollments });
  },
}));
