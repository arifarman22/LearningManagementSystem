export default {
  routes: [
    { method: 'GET',    path: '/questions',     handler: 'question.find',    config: {} },
    { method: 'GET',    path: '/questions/:id', handler: 'question.findOne', config: {} },
    { method: 'POST',   path: '/questions',     handler: 'question.create',  config: {} },
    { method: 'PUT',    path: '/questions/:id', handler: 'question.update',  config: {} },
    { method: 'DELETE', path: '/questions/:id', handler: 'question.delete',  config: {} },
  ],
};
