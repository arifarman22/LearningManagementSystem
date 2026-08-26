import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::enrollment.enrollment' as any, ({ strapi }) => ({

  async findExisting(studentId: number, courseId: number) {
    return strapi.db.query('api::enrollment.enrollment').findOne({
      where: { student: studentId, course: courseId },
    });
  },

  async enrollStudent(studentId: number, courseId: number) {
    const existing = await this.findExisting(studentId, courseId);
    if (existing) throw { status: 409, message: 'Already enrolled in this course' };
    return strapi.db.query('api::enrollment.enrollment').create({
      data: { student: studentId, course: courseId, enrolledAt: new Date(), status: 'active' },
      populate: ['course', 'student'],
    });
  },
}));
