'use strict';

module.exports = (plugin) => {
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state?.user) {
      return ctx.unauthorized();
    }

    const userId = ctx.state.user.id;

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    });

    if (!user) return ctx.notFound();

    const { password, resetPasswordToken, confirmationToken, ...safeUser } = user;
    ctx.body = safeUser;
  };

  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    // Run default registration first
    await originalRegister(ctx);

    // If it failed, stop
    if (ctx.status >= 400) return;

    // Find the student role
    const studentRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { $or: [{ type: 'student' }, { name: 'student' }] },
    });

    if (!studentRole) return; // no student role found, leave as-is

    // Assign student role to the newly registered user
    const userId = ctx.body?.user?.id;
    if (!userId) return;

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { role: studentRole.id },
    });

    // Re-fetch user with role populated and update response
    const updatedUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    });

    const { password, resetPasswordToken, confirmationToken, ...safeUser } = updatedUser;
    ctx.body.user = safeUser;
  };

  return plugin;
};
