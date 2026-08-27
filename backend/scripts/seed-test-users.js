const http = require('http');

const ADMIN_EMAIL = 'arifarman7862@gmail.com';
const ADMIN_PASSWORD = (() => {
  const arg = process.argv.find(a => a.startsWith('--admin-password='));
  return arg ? arg.split('=')[1] : '';
})();



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

async function main() {
  // 1. Admin login
  console.log('Logging in...');
  const loginRes = await req('POST', '/admin/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!loginRes.body?.data?.token) { console.error('Login failed:', JSON.stringify(loginRes.body)); process.exit(1); }
  const token = loginRes.body.data.token;
  console.log('Logged in.\n');

  // 2. Get existing roles
  const rolesRes = await req('GET', '/users-permissions/roles', null, token);
  let roles = rolesRes.body?.roles ?? [];
  console.log('Existing roles:', roles.map(r => `${r.name}(${r.id})`).join(', '));

  // 3. Create instructor role if missing
  let instructorRole = roles.find(r => r.name.toLowerCase() === 'instructor');
  if (!instructorRole) {
    console.log('Creating instructor role...');
    const r = await req('POST', '/users-permissions/roles', { name: 'instructor', description: 'Course instructor', permissions: {}, users: [] }, token);
    console.log('Create instructor role response:', r.status, JSON.stringify(r.body).slice(0, 200));
    // Re-fetch roles
    const r2 = await req('GET', '/users-permissions/roles', null, token);
    roles = r2.body?.roles ?? [];
    instructorRole = roles.find(r => r.name.toLowerCase() === 'instructor');
  }

  // 4. Create student role if missing
  let studentRole = roles.find(r => r.name.toLowerCase() === 'student');
  if (!studentRole) {
    console.log('Creating student role...');
    const r = await req('POST', '/users-permissions/roles', { name: 'student', description: 'Enrolled student', permissions: {}, users: [] }, token);
    console.log('Create student role response:', r.status, JSON.stringify(r.body).slice(0, 200));
    const r2 = await req('GET', '/users-permissions/roles', null, token);
    roles = r2.body?.roles ?? [];
    studentRole = roles.find(r => r.name.toLowerCase() === 'student');
  }

  const authRole = roles.find(r => r.name.toLowerCase() === 'authenticated');
  console.log('\nRoles after setup:', roles.map(r => `${r.name}(${r.id})`).join(', '));

  // 5. Get all users via content-manager
  const usersRes = await req('GET', '/content-manager/collection-types/plugin::users-permissions.user?pageSize=25', null, token);
  const users = usersRes.body?.results ?? [];
  console.log('\nUsers found:', users.map(u => `${u.email}(${u.id})`).join(', '));

  const roleMap = {
    'admin@test.com':       authRole?.id,
    'instructor@test.com':  instructorRole?.id,
    'instructor2@test.com': instructorRole?.id,
    'student@test.com':     studentRole?.id,
  };

  // 6. Assign roles and confirm users
  for (const user of users) {
    const roleId = roleMap[user.email];
    if (!roleId) continue;
    const upd = await req('PUT',
      `/content-manager/collection-types/plugin::users-permissions.user/${user.documentId}`,
      { confirmed: true, blocked: false, role: roleId },
      token
    );
    console.log(upd.status === 200
      ? `✓ ${user.email} → role ${roleId}`
      : `✗ ${user.email} failed: ${JSON.stringify(upd.body).slice(0, 150)}`
    );
  }

  console.log('\nDone! Run: npm test');
}

main().catch(console.error);
