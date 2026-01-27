import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

// supports both system admin and university_admin
export async function GET(request) {
try {
const user = getCurrentUser(request);
if (!user || (user.userType !== 'admin' && user.userType !== 'university_admin')) {
return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

// fetch base user and university_admins data (if any)
const [rows] = await db.execute(
`SELECT u.id as user_id, u.first_name, u.last_name, u.email, ua.university_id, ua.can_manage_nonprofits, ua.can_manage_students, ua.can_manage_admins, uni.name as university_name
FROM users u
LEFT JOIN university_admins ua ON ua.user_id = u.id
LEFT JOIN universities uni ON ua.university_id = uni.id
WHERE u.id = ? LIMIT 1`,
[user.id]
);

if (!rows || rows.length === 0) {
return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
}

return new Response(JSON.stringify({ profile: rows[0] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} catch (error) {
console.error('Error fetching admin profile:', error);
return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
}
}

export async function PUT(request) {
try {
const user = getCurrentUser(request);
if (!user || (user.userType !== 'admin' && user.userType !== 'university_admin')) {
return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const body = await request.json();
const { first_name, last_name, email, university_id, can_manage_nonprofits, can_manage_students, can_manage_admins } = body;

// update users
if (email) {
const [emailExist] = await db.execute('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, user.id]);
if (emailExist && emailExist.length) {
return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
}
}

await db.execute('UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = NOW() WHERE id = ?', [first_name || null, last_name || null, email || null, user.id]);

// upsert university_admins row when role is university_admin
if (user.userType === 'university_admin') {
await db.execute(
`INSERT INTO university_admins (user_id, university_id, can_manage_nonprofits, can_manage_students, can_manage_admins)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE university_id = VALUES(university_id), can_manage_nonprofits = VALUES(can_manage_nonprofits), can_manage_students = VALUES(can_manage_students), can_manage_admins = VALUES(can_manage_admins)`,
[user.id, university_id || null, can_manage_nonprofits ? 1 : 0, can_manage_students ? 1 : 0, can_manage_admins ? 1 : 0]
);
}

const [updated] = await db.execute(
`SELECT u.id as user_id, u.first_name, u.last_name, u.email, ua.university_id, ua.can_manage_nonprofits, ua.can_manage_students, ua.can_manage_admins, uni.name as university_name
FROM users u
LEFT JOIN university_admins ua ON ua.user_id = u.id
LEFT JOIN universities uni ON ua.university_id = uni.id
WHERE u.id = ? LIMIT 1`,
[user.id]
);

    return new Response(JSON.stringify({ profile: updated[0], message: 'Admin profile saved' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} catch (error) {
    console.error('Error saving admin profile:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}