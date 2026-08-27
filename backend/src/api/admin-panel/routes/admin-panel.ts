export default {
  routes: [
    { method: 'GET',   path: '/admin-panel/me',                 handler: 'admin-panel.me',         config: {} },
    { method: 'GET',   path: '/admin-panel/users',              handler: 'admin-panel.listUsers',  config: {} },
    { method: 'GET',   path: '/admin-panel/stats',              handler: 'admin-panel.getStats',   config: {} },
    { method: 'GET',   path: '/admin-panel/roles',              handler: 'admin-panel.listRoles',  config: {} },
    { method: 'GET',   path: '/admin-panel/users/:id',          handler: 'admin-panel.getUser',    config: {} },
    { method: 'PATCH', path: '/admin-panel/users/:id/role',     handler: 'admin-panel.changeRole', config: {} },
    { method: 'PATCH', path: '/admin-panel/users/:id/block',    handler: 'admin-panel.blockUser',  config: {} },
    { method: 'PATCH', path: '/admin-panel/users/:id/unblock',  handler: 'admin-panel.unblockUser',config: {} },
    { method: 'DELETE',path: '/admin-panel/users/:id',          handler: 'admin-panel.deleteUser', config: {} },
  ],
};
