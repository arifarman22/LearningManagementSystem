export default {
  routes: [
    { method: 'GET',    path: '/my-courses',         handler: 'enrollment.myCourses', config: {} },
    { method: 'GET',    path: '/enrollments',         handler: 'enrollment.find',      config: {} },
    { method: 'GET',    path: '/enrollments/:id',     handler: 'enrollment.findOne',   config: {} },
    { method: 'POST',   path: '/enrollments',         handler: 'enrollment.create',    config: {} },
    { method: 'DELETE', path: '/enrollments/:id',     handler: 'enrollment.delete',    config: {} },
  ],
};
