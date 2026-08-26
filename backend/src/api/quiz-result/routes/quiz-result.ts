export default {
  routes: [
    { method: 'GET',  path: '/quiz-results',        handler: 'quiz-result.find',    config: {} },
    { method: 'GET',  path: '/quiz-results/:id',    handler: 'quiz-result.findOne', config: {} },
    { method: 'POST', path: '/quiz-results/submit', handler: 'quiz-result.submit',  config: {} },
  ],
};
