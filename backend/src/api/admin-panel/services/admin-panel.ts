export default ({ strapi }: { strapi: any }) => ({

  async listUsers() {
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      populate: ['role'],
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u: any) => ({
      id: u.id,
      documentId: u.documentId,
      username: u.username,
      email: u.email,
      confirmed: u.confirmed,
      blocked: u.blocked,
      role: u.role ? { id: u.role.id, name: u.role.name, type: u.role.type?.replace(/_/g, '-') } : null,
      createdAt: u.createdAt,
    }));
  },

  async getUser(userId: number) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    });
    if (!user) throw { status: 404, message: 'User not found' };
    return {
      id: user.id,
      documentId: user.documentId,
      username: user.username,
      email: user.email,
      confirmed: user.confirmed,
      blocked: user.blocked,
      role: user.role ? { id: user.role.id, name: user.role.name, type: user.role.type?.replace(/_/g, '-') } : null,
      createdAt: user.createdAt,
    };
  },

  async changeRole(userId: number, roleId: number) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    });
    if (!user) throw { status: 404, message: 'User not found' };

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { id: roleId },
    });
    if (!role) throw { status: 404, message: 'Role not found' };

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { role: roleId },
    });

    return this.getUser(userId);
  },

  async blockUser(userId: number) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    if (user.blocked) throw { status: 409, message: 'User is already blocked' };

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { blocked: true },
    });
    return this.getUser(userId);
  },

  async unblockUser(userId: number) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    if (!user.blocked) throw { status: 409, message: 'User is not blocked' };

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { blocked: false },
    });
    return this.getUser(userId);
  },

  async deleteUser(userId: number) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    await strapi.db.query('plugin::users-permissions.user').delete({ where: { id: userId } });
  },

  async getStats() {
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      activeEnrollments,
      totalBlogPosts,
      publishedBlogPosts,
      totalQuizzes,
      totalQuizResults,
      totalLessons,
    ] = await Promise.all([
      strapi.db.query('plugin::users-permissions.user').count({}),
      strapi.db.query('api::course.course').count({}),
      strapi.db.query('api::course.course').count({ where: { status: 'published' } }),
      strapi.db.query('api::course.course').count({ where: { status: 'draft' } }),
      strapi.db.query('api::enrollment.enrollment').count({}),
      strapi.db.query('api::enrollment.enrollment').count({ where: { status: 'active' } }),
      strapi.db.query('api::blog-post.blog-post').count({}),
      strapi.db.query('api::blog-post.blog-post').count({ where: { status: 'published' } }),
      strapi.db.query('api::quiz.quiz').count({}),
      strapi.db.query('api::quiz-result.quiz-result').count({}),
      strapi.db.query('api::lesson.lesson').count({}),
    ]);

    // Users by role
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({});
    const usersByRole: Record<string, number> = {};
    await Promise.all(
      roles.map(async (role: any) => {
        usersByRole[role.type] = await strapi.db
          .query('plugin::users-permissions.user')
          .count({ where: { role: role.id } });
      })
    );

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
      },
      blogPosts: {
        total: totalBlogPosts,
        published: publishedBlogPosts,
        draft: totalBlogPosts - publishedBlogPosts,
      },
      quizzes: {
        total: totalQuizzes,
        results: totalQuizResults,
      },
      lessons: {
        total: totalLessons,
      },
    };
  },

  async listRoles() {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({
      orderBy: { name: 'asc' },
    });
    return roles.map((r: any) => ({ id: r.id, name: r.name, type: r.type, description: r.description }));
  },
});
