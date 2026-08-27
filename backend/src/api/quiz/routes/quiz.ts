export default {
  routes: [
    { method: 'GET',    path: '/quizzes',     handler: 'quiz.find',    config: {} },
    { method: 'GET',    path: '/quizzes/:id', handler: 'quiz.findOne', config: {} },
    { method: 'POST',   path: '/quizzes',     handler: 'quiz.create',  config: {} },
    { method: 'PUT',    path: '/quizzes/:id', handler: 'quiz.update',  config: {} },
    { method: 'DELETE', path: '/quizzes/:id', handler: 'quiz.delete',  config: {} },
  ],
};
