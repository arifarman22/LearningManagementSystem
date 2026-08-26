export default {
  routes: [
    { method: 'GET',  path: '/courses/:id/progress',  handler: 'lesson-progress.courseProgress', config: {} },
    { method: 'GET',  path: '/lesson-progresses',     handler: 'lesson-progress.find',           config: {} },
    { method: 'GET',  path: '/lesson-progresses/:id', handler: 'lesson-progress.findOne',        config: {} },
    { method: 'POST', path: '/lesson-progresses',     handler: 'lesson-progress.create',         config: {} },
  ],
};
