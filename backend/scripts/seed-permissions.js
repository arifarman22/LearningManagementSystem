/**
 * Grants API permissions to all roles.
 * Run: node scripts/seed-permissions.js --admin-password=YOUR_PASSWORD
 */

const http = require('http');

const ADMIN_EMAIL    = 'arifarman7862@gmail.com';
const ADMIN_PASSWORD = (() => {
  const arg = process.argv.find(a => a.startsWith('--admin-password='));
  return arg ? arg.split('=')[1] : '';
})();

if (!ADMIN_PASSWORD) {
  console.error('Usage: node scripts/seed-permissions.js --admin-password=YOUR_PASSWORD');
  process.exit(1);
}

async function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 1337,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

// Permissions each role should have — keys match Strapi 5 format: api::<name>
const ADMIN_PERMISSIONS = {
  'api::admin-panel': { controller: 'admin-panel', actions: ['me', 'listUsers', 'getUser', 'changeRole', 'blockUser', 'unblockUser', 'deleteUser', 'getStats', 'listRoles'] },
  'api::course':      { controller: 'course',      actions: ['find', 'findOne', 'create', 'update', 'delete', 'publish', 'unpublish'] },
  'api::lesson':      { controller: 'lesson',      actions: ['find', 'findOne', 'create', 'update', 'delete', 'reorder'] },
  'api::quiz':        { controller: 'quiz',        actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::question':    { controller: 'question',    actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::option':      { controller: 'option',      actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::quiz-result': { controller: 'quiz-result', actions: ['find', 'findOne', 'submit'] },
  'api::enrollment':  { controller: 'enrollment',  actions: ['find', 'findOne', 'create', 'delete', 'myCourses'] },
  'api::blog-post':   { controller: 'blog-post',   actions: ['find', 'findOne', 'getBySlug', 'create', 'update', 'publish', 'unpublish', 'delete'] },
};

const CONTENT_MANAGER_PERMISSIONS = {
  'api::course':      { controller: 'course',      actions: ['find', 'findOne', 'create', 'update', 'delete', 'publish', 'unpublish'] },
  'api::lesson':      { controller: 'lesson',      actions: ['find', 'findOne', 'create', 'update', 'delete', 'reorder'] },
  'api::quiz':        { controller: 'quiz',        actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::question':    { controller: 'question',    actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::option':      { controller: 'option',      actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::quiz-result': { controller: 'quiz-result', actions: ['find', 'findOne'] },
  'api::enrollment':  { controller: 'enrollment',  actions: ['find', 'findOne'] },
  'api::blog-post':   { controller: 'blog-post',   actions: ['find', 'findOne', 'getBySlug', 'create', 'update', 'publish', 'unpublish', 'delete'] },
  'api::lesson-progress': { controller: 'lesson-progress', actions: ['find', 'findOne', 'courseProgress'] },
};

const INSTRUCTOR_PERMISSIONS = {
  'api::course':           { controller: 'course',          actions: ['find', 'findOne', 'create', 'update', 'delete', 'publish', 'unpublish'] },
  'api::lesson':           { controller: 'lesson',          actions: ['find', 'findOne', 'create', 'update', 'delete', 'reorder'] },
  'api::enrollment':       { controller: 'enrollment',      actions: ['find', 'findOne', 'myCourses'] },
  'api::quiz':             { controller: 'quiz',            actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::question':         { controller: 'question',        actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::option':           { controller: 'option',          actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  'api::quiz-result':      { controller: 'quiz-result',     actions: ['find', 'findOne'] },
  'api::lesson-progress':  { controller: 'lesson-progress', actions: ['find', 'findOne', 'courseProgress'] },
};

const STUDENT_PERMISSIONS = {
  'api::blog-post': { controller: 'blog-post', actions: ['find', 'findOne', 'getBySlug'] },
  'api::course':           { controller: 'course',          actions: ['find', 'findOne'] },
  'api::lesson':           { controller: 'lesson',          actions: ['find', 'findOne'] },
  'api::enrollment':       { controller: 'enrollment',      actions: ['find', 'findOne', 'create', 'delete', 'myCourses'] },
  'api::quiz':             { controller: 'quiz',            actions: ['find', 'findOne'] },
  'api::question':         { controller: 'question',        actions: ['find', 'findOne'] },
  'api::option':           { controller: 'option',          actions: ['find', 'findOne'] },
  'api::quiz-result':      { controller: 'quiz-result',     actions: ['find', 'findOne', 'submit'] },
  'api::lesson-progress':  { controller: 'lesson-progress', actions: ['find', 'findOne', 'create', 'courseProgress'] },
};

const AUTHENTICATED_PERMISSIONS = {
  'api::blog-post': { controller: 'blog-post', actions: ['find', 'findOne', 'getBySlug'] },
  'api::course':           { controller: 'course',          actions: ['find', 'findOne'] },
  'api::lesson':           { controller: 'lesson',          actions: ['find', 'findOne'] },
  'api::enrollment':       { controller: 'enrollment',      actions: ['find', 'findOne'] },
  'api::quiz':             { controller: 'quiz',            actions: ['find', 'findOne'] },
  'api::question':         { controller: 'question',        actions: ['find', 'findOne'] },
  'api::option':           { controller: 'option',          actions: ['find', 'findOne'] },
  'api::quiz-result':      { controller: 'quiz-result',     actions: ['find', 'findOne'] },
  'api::lesson-progress':  { controller: 'lesson-progress', actions: ['find', 'findOne'] },
};

async function main() {
  // Login
  console.log('Logging in...');
  const loginRes = await req('POST', '/admin/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!loginRes.body?.data?.token) { console.error('Login failed:', JSON.stringify(loginRes.body)); process.exit(1); }
  const token = loginRes.body.data.token;
  console.log('Logged in.\n');

  // Get roles
  const rolesRes = await req('GET', '/users-permissions/roles', null, token);
  const roles = rolesRes.body?.roles ?? [];
  console.log('Roles:', roles.map(r => `${r.name}(${r.id})`).join(', '));

  const roleMap = {
    authenticated: roles.find(r => r.name.toLowerCase() === 'authenticated'),
    instructor:    roles.find(r => r.name.toLowerCase() === 'instructor'),
    student:       roles.find(r => r.name.toLowerCase() === 'student'),
  };

  // Get full role details (includes permissions structure)
  async function applyPermissions(role, permMap) {
    if (!role) { console.log('Role not found, skipping'); return; }

    const roleRes = await req('GET', `/users-permissions/roles/${role.id}`, null, token);
    const fullRole = roleRes.body?.role;
    if (!fullRole) { console.error('Could not fetch role details for', role.name); return; }

    const permissions = fullRole.permissions ?? {};

    for (const [apiKey, { controller, actions }] of Object.entries(permMap)) {
      if (!permissions[apiKey]) permissions[apiKey] = { controllers: {} };
      if (!permissions[apiKey].controllers) permissions[apiKey].controllers = {};
      if (!permissions[apiKey].controllers[controller]) permissions[apiKey].controllers[controller] = {};
      for (const action of actions) {
        permissions[apiKey].controllers[controller][action] = { enabled: true, policy: '' };
      }
    }

    const updateRes = await req('PUT', `/users-permissions/roles/${role.id}`, {
      name: role.name,
      description: role.description,
      permissions,
    }, token);

    console.log(`${updateRes.status === 200 ? '✓' : '✗'} Permissions set for role: ${role.name}`);
    if (updateRes.status !== 200) {
      console.error('  Error:', JSON.stringify(updateRes.body).slice(0, 300));
    }
  }

  // admin role
  const adminRole = roles.find(r => r.name.toLowerCase() === 'admin');
  if (adminRole) await applyPermissions(adminRole, ADMIN_PERMISSIONS);
  else console.warn('No admin role found — skipping admin permissions');

  // content-manager role
  const contentManagerRole = roles.find(r => r.name.toLowerCase() === 'content-manager');
  if (contentManagerRole) {
    await applyPermissions(contentManagerRole, CONTENT_MANAGER_PERMISSIONS);
  }

  await applyPermissions(roleMap.authenticated, AUTHENTICATED_PERMISSIONS);
  await applyPermissions(roleMap.instructor,    INSTRUCTOR_PERMISSIONS);
  await applyPermissions(roleMap.student,       STUDENT_PERMISSIONS);

  console.log('\nDone! Run: npm test');
}

main().catch(console.error);
