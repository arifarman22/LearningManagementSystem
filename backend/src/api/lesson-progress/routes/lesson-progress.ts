export default {
  routes: [
    { method: 'GET',  path: '/lesson-progress/course-progress', handler: 'lesson-progress.courseProgress', config: {} },
    { method: 'GET',  path: '/lesson-progress',                 handler: 'lesson-progress.find',           config: {} },
    { method: 'GET',  path: '/lesson-progress/:id',             handler: 'lesson-progress.findOne',        config: {} },
    { method: 'POST', path: '/lesson-progress',                 handler: 'lesson-progress.create',         config: {} },
  ],
};
