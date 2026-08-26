import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::lesson.lesson' as any, ({ strapi }) => ({

  async validateCourseExists(courseId: number) {
    const course = await strapi.db.query('api::course.course').findOne({ where: { id: courseId } });
    if (!course) throw { status: 404, message: 'Course not found' };
    return course;
  },

  async validateLessonData(data: any, requireContent = true) {
    const { title, content, videoUrl, order } = data;

    if (!title || title.trim().length < 3) {
      throw { status: 400, message: 'title must be at least 3 characters' };
    }
    if (title.length > 200) {
      throw { status: 400, message: 'title must be at most 200 characters' };
    }
    if (requireContent && !content && !videoUrl) {
      throw { status: 400, message: 'Either content or videoUrl is required' };
    }
    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 1) {
        throw { status: 400, message: 'order must be a positive integer' };
      }
    }
  },

  async getNextOrder(courseId: number): Promise<number> {
    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: { course: courseId },
      orderBy: { order: 'desc' },
      limit: 1,
    });
    return lessons.length > 0 ? lessons[0].order + 1 : 1;
  },

  async isOrderTaken(courseId: number, order: number, excludeLessonId?: number): Promise<boolean> {
    const existing = await strapi.db.query('api::lesson.lesson').findOne({
      where: { course: courseId, order },
    });
    if (!existing) return false;
    if (excludeLessonId && existing.id === excludeLessonId) return false;
    return true;
  },

  async createLesson(data: any) {
    const { title, content, videoUrl, order, course: courseId } = data;

    if (!courseId) throw { status: 400, message: 'course is required' };
    await this.validateCourseExists(Number(courseId));
    await this.validateLessonData(data, true);

    const resolvedOrder = order ?? (await this.getNextOrder(Number(courseId)));

    if (await this.isOrderTaken(Number(courseId), resolvedOrder)) {
      // Shift existing lessons at this order and above up by 1
      await this.shiftLessonsUp(Number(courseId), resolvedOrder);
    }

    return strapi.db.query('api::lesson.lesson').create({
      data: {
        title: title.trim(),
        content: content ?? null,
        videoUrl: videoUrl ?? null,
        order: resolvedOrder,
        course: Number(courseId),
      },
      populate: ['course'],
    });
  },

  async updateLesson(lessonId: number, data: any) {
    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { id: lessonId },
      populate: ['course'],
    });
    if (!lesson) throw { status: 404, message: 'Lesson not found' };

    const { title, content, videoUrl, order } = data;

    if (title !== undefined) {
      if (title.trim().length < 3) throw { status: 400, message: 'title must be at least 3 characters' };
      if (title.length > 200) throw { status: 400, message: 'title must be at most 200 characters' };
    }
    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 1) {
        throw { status: 400, message: 'order must be a positive integer' };
      }
      if (await this.isOrderTaken(lesson.course.id, order, lessonId)) {
        await this.shiftLessonsUp(lesson.course.id, order, lessonId);
      }
    }

    const payload: any = {};
    if (title !== undefined) payload.title = title.trim();
    if (content !== undefined) payload.content = content;
    if (videoUrl !== undefined) payload.videoUrl = videoUrl;
    if (order !== undefined) payload.order = order;

    return strapi.db.query('api::lesson.lesson').update({
      where: { id: lessonId },
      data: payload,
      populate: ['course'],
    });
  },

  async deleteLesson(lessonId: number) {
    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { id: lessonId },
      populate: ['course'],
    });
    if (!lesson) throw { status: 404, message: 'Lesson not found' };

    // Delete associated progress records
    await strapi.db.query('api::lesson-progress.lesson-progress').deleteMany({
      where: { lesson: lessonId },
    });

    await strapi.db.query('api::lesson.lesson').delete({ where: { id: lessonId } });

    // Close the gap in ordering
    await this.compactOrder(lesson.course.id);

    return lesson;
  },

  async reorderLessons(courseId: number, orderedIds: number[]) {
    await this.validateCourseExists(courseId);

    // Verify all IDs belong to this course
    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: { course: courseId },
    });
    const courselessonIds = new Set(lessons.map((l: any) => l.id));
    for (const id of orderedIds) {
      if (!courselessonIds.has(id)) {
        throw { status: 400, message: `Lesson ${id} does not belong to this course` };
      }
    }
    if (orderedIds.length !== lessons.length) {
      throw { status: 400, message: 'orderedIds must include all lessons in the course' };
    }

    // Apply new order
    await Promise.all(
      orderedIds.map((id, index) =>
        strapi.db.query('api::lesson.lesson').update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return strapi.db.query('api::lesson.lesson').findMany({
      where: { course: courseId },
      orderBy: { order: 'asc' },
      populate: ['course'],
    });
  },

  async shiftLessonsUp(courseId: number, fromOrder: number, excludeId?: number) {
    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: { course: courseId, order: { $gte: fromOrder } },
      orderBy: { order: 'desc' },
    });
    for (const lesson of lessons) {
      if (excludeId && lesson.id === excludeId) continue;
      await strapi.db.query('api::lesson.lesson').update({
        where: { id: lesson.id },
        data: { order: lesson.order + 1 },
      });
    }
  },

  async compactOrder(courseId: number) {
    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: { course: courseId },
      orderBy: { order: 'asc' },
    });
    for (let i = 0; i < lessons.length; i++) {
      if (lessons[i].order !== i + 1) {
        await strapi.db.query('api::lesson.lesson').update({
          where: { id: lessons[i].id },
          data: { order: i + 1 },
        });
      }
    }
  },
}));
