export default {
  routes: [
    { method: 'GET',    path: '/courses',               handler: 'course.find',      config: { auth: false } },
    { method: 'GET',    path: '/courses/:id',           handler: 'course.findOne',   config: { auth: false } },
    { method: 'POST',   path: '/courses',               handler: 'course.create',    config: {} },
    { method: 'PUT',    path: '/courses/:id',           handler: 'course.update',    config: {} },
    { method: 'DELETE', path: '/courses/:id',           handler: 'course.delete',    config: {} },
    { method: 'PATCH',  path: '/courses/:id/publish',   handler: 'course.publish',   config: {} },
    { method: 'PATCH',  path: '/courses/:id/unpublish', handler: 'course.unpublish', config: {} },
  ],
};
