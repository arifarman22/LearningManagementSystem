export default {
  routes: [
    { method: 'GET',    path: '/lessons',                           handler: 'lesson.find',    config: {} },
    { method: 'GET',    path: '/lessons/:id',                       handler: 'lesson.findOne', config: {} },
    { method: 'POST',   path: '/lessons',                           handler: 'lesson.create',  config: {} },
    { method: 'PUT',    path: '/lessons/:id',                       handler: 'lesson.update',  config: {} },
    { method: 'DELETE', path: '/lessons/:id',                       handler: 'lesson.delete',  config: {} },
    { method: 'PATCH',  path: '/courses/:courseId/lessons/reorder', handler: 'lesson.reorder', config: {} },
  ],
};
