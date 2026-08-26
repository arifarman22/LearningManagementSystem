import type { Core } from '@strapi/strapi';

export type AuthUser = {
  id: number;
  role: { type: string };
};

export function getAuthUser(ctx: any): AuthUser {
  const user = ctx.state?.user;
  if (!user) {
    ctx.throw(401, 'Authentication required');
  }
  return user as AuthUser;
}

export function requireRole(ctx: any, ...roles: string[]): AuthUser {
  const user = getAuthUser(ctx);
  if (!roles.includes(user.role?.type)) {
    ctx.throw(403, 'Forbidden');
  }
  return user;
}

export function isRole(user: AuthUser, ...roles: string[]): boolean {
  return roles.includes(user.role?.type);
}

export async function requireEnrollment(
  strapi: Core.Strapi,
  studentId: number,
  courseId: number
): Promise<void> {
  const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
    where: { student: studentId, course: courseId, status: 'active' },
  });
  if (!enrollment) {
    throw { status: 403, message: 'Not enrolled in this course' };
  }
}

export async function getCourseOrThrow(
  strapi: Core.Strapi,
  courseId: number,
  ctx: any
): Promise<any> {
  const course = await strapi.db.query('api::course.course').findOne({
    where: { id: courseId },
    populate: ['instructor'],
  });
  if (!course) ctx.throw(404, 'Course not found');
  return course;
}

export async function requireCourseOwnership(
  strapi: Core.Strapi,
  courseId: number,
  userId: number,
  ctx: any
): Promise<any> {
  const course = await getCourseOrThrow(strapi, courseId, ctx);
  if (course.instructor?.id !== userId) {
    ctx.throw(403, 'Forbidden: you do not own this course');
  }
  return course;
}
