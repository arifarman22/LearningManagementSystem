import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::lesson-progress.lesson-progress' as any, ({ strapi }) => ({

  async markComplete(studentId: number, lessonId: number, courseId: number) {
    const existing = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: { student: studentId, lesson: lessonId },
    });

    if (existing) {
      if (existing.completed) return existing;
      return strapi.db.query('api::lesson-progress.lesson-progress').update({
        where: { id: existing.id },
        data: { completed: true, completedAt: new Date() },
        populate: ['lesson', 'course'],
      });
    }

    return strapi.db.query('api::lesson-progress.lesson-progress').create({
      data: { student: studentId, lesson: lessonId, course: courseId, completed: true, completedAt: new Date() },
      populate: ['lesson', 'course'],
    });
  },

  async courseProgress(studentId: number, courseId: number) {
    const [totalLessons, completedRecords] = await Promise.all([
      strapi.db.query('api::lesson.lesson').count({ where: { course: courseId } }),
      strapi.db.query('api::lesson-progress.lesson-progress').count({
        where: { student: studentId, course: courseId, completed: true },
      }),
    ]);

    const percentage = totalLessons === 0 ? 0 : Math.round((completedRecords / totalLessons) * 100 * 100) / 100;
    return { totalLessons, completedLessons: completedRecords, percentage };
  },
}));
