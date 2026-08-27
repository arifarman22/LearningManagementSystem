export default {
  routes: [
    { method: 'GET',    path: '/blog-posts',                  handler: 'blog-post.find',        config: { auth: false } },
    { method: 'GET',    path: '/blog-posts/slug/:slug',       handler: 'blog-post.getBySlug',   config: { auth: false } },
    { method: 'GET',    path: '/blog-posts/:id',              handler: 'blog-post.findOne',     config: { auth: false } },
    { method: 'POST',   path: '/blog-posts',                  handler: 'blog-post.create',      config: {} },
    { method: 'PUT',    path: '/blog-posts/:id',              handler: 'blog-post.update',      config: {} },
    { method: 'PATCH',  path: '/blog-posts/:id/publish',      handler: 'blog-post.publish',     config: {} },
    { method: 'PATCH',  path: '/blog-posts/:id/unpublish',    handler: 'blog-post.unpublish',   config: {} },
    { method: 'DELETE', path: '/blog-posts/:id',              handler: 'blog-post.delete',      config: {} },
  ],
};
