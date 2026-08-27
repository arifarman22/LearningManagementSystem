import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::course.course' as any, ({ strapi }) => ({

  async createCourse(data: any, instructorId?: number) {
    const { title, description, status, thumbnail } = data;

    if (!title || title.trim().length < 3) {
      throw { status: 400, message: 'title must be at least 3 characters' };
    }
    if (title.length > 200) {
      throw { status: 400, message: 'title must be at most 200 characters' };
    }
    if (!description || description.trim().length === 0) {
      throw { status: 400, message: 'description is required' };
    }
    if (status && !['draft', 'published'].includes(status)) {
      throw { status: 400, message: 'status must be draft or published' };
    }

    const slug = title.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const payload: any = {
      title: title.trim(),
      slug,
      description: description.trim(),
      status: status ?? 'draft',
    };
    if (thumbnail) payload.thumbnail = thumbnail;
    if (instructorId) payload.instructor = instructorId;

    return strapi.db.query('api::course.course').create({
      data: payload,
      populate: ['instructor'],
    });
  },

  async updateCourse(courseId: number, data: any) {
    const { title, description, status, thumbnail } = data;

    if (title !== undefined) {
      if (title.trim().length < 3) throw { status: 400, message: 'title must be at least 3 characters' };
      if (title.length > 200) throw { status: 400, message: 'title must be at most 200 characters' };
    }
    if (description !== undefined && description.trim().length === 0) {
      throw { status: 400, message: 'description cannot be empty' };
    }
    if (status !== undefined && !['draft', 'published'].includes(status)) {
      throw { status: 400, message: 'status must be draft or published' };
    }

    const payload: any = {};
    if (title !== undefined) payload.title = title.trim();
    if (description !== undefined) payload.description = description.trim();
    if (status !== undefined) payload.status = status;
    if (thumbnail !== undefined) payload.thumbnail = thumbnail;

    return strapi.db.query('api::course.course').update({
      where: { id: courseId },
      data: payload,
      populate: ['instructor'],
    });
  },

  async deleteCourse(courseId: number) {
    // Delete all lessons, enrollments, and quizzes belonging to this course first
    await strapi.db.query('api::lesson.lesson').deleteMany({ where: { course: courseId } });
    await strapi.db.query('api::enrollment.enrollment').deleteMany({ where: { course: courseId } });
    await strapi.db.query('api::quiz.quiz').deleteMany({ where: { course: courseId } });

    return strapi.db.query('api::course.course').delete({ where: { id: courseId } });
  },

  async publishCourse(courseId: number) {
    const course = await strapi.db.query('api::course.course').findOne({ where: { id: courseId } });
    if (!course) throw { status: 404, message: 'Course not found' };
    if (course.status === 'published') throw { status: 409, message: 'Course is already published' };

    return strapi.db.query('api::course.course').update({
      where: { id: courseId },
      data: { status: 'published' },
      populate: ['instructor'],
    });
  },

  async unpublishCourse(courseId: number) {
    const course = await strapi.db.query('api::course.course').findOne({ where: { id: courseId } });
    if (!course) throw { status: 404, message: 'Course not found' };
    if (course.status === 'draft') throw { status: 409, message: 'Course is already unpublished' };

    return strapi.db.query('api::course.course').update({
      where: { id: courseId },
      data: { status: 'draft' },
      populate: ['instructor'],
    });
  },
}));
