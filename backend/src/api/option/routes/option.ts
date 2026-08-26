export default {
  routes: [
    { method: 'GET',    path: '/options',     handler: 'option.find',    config: {} },
    { method: 'GET',    path: '/options/:id', handler: 'option.findOne', config: {} },
    { method: 'POST',   path: '/options',     handler: 'option.create',  config: {} },
    { method: 'PUT',    path: '/options/:id', handler: 'option.update',  config: {} },
    { method: 'DELETE', path: '/options/:id', handler: 'option.delete',  config: {} },
  ],
};
