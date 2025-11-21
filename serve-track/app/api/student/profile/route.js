import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
try {
const user = getCurrentUser(request);
if (!user || user.userType !== 'student') {
return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const [rows] = await db.execute(
`SELECT
sp.user_id,
sp.student_id,
sp.university_id,
u.first_name,
u.last_name,
u.email,
sp.major,
sp.total_verified_hours,
uni.name as university_name,
u.profile_complete
FROM student_profiles sp
JOIN users u ON sp.user_id = u.id
LEFT JOIN universities uni ON sp.university_id = uni.id
WHERE sp.user_id = ? LIMIT 1`,
[user.id]
);

if (!rows || rows.length === 0) {
return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
}

const profile = rows[0] || null;

// Fetch universities
const [unis] = await db.execute(
      `SELECT id, name FROM universities ORDER BY name ASC`
);

return new Response(JSON.stringify({ profile, universities:unis }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} catch (error) {
console.error('Error fetching student profile:', error);
return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
}
}

export async function PUT(request) {
try {
const user = getCurrentUser(request);
if (!user || user.userType !== 'student') {
return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const body = await request.json();
const { first_name, last_name, email, student_id, university_id, major } = body;

if (!student_id || !university_id) {
return new Response(JSON.stringify({ error: 'Missing required fields (student_id, university_id)' }), { status: 400 });
}

// enforce unique student_id
const [existing] = await db.execute('SELECT user_id FROM student_profiles WHERE student_id = ? AND user_id <> ? LIMIT 1', [student_id, user.id]);
if (existing && existing.length) {
return new Response(JSON.stringify({ error: 'Student ID already in use' }), { status: 409 });
}

// update users table if necessary
if (email) {
    const [emailExist] = await db.execute('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, user.id]);
    if (emailExist && emailExist.length) {
    return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
    }
    await db.execute('UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = NOW() WHERE id = ?', [first_name || null, last_name || null, email, user.id]);
} else if (first_name || last_name) {
await db.execute('UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?', [first_name || null, last_name || null, user.id]);
}

await db.execute(
    `INSERT INTO student_profiles (user_id, student_id, university_id, major)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE student_id = VALUES(student_id), university_id = VALUES(university_id), major = VALUES(major)`,
    [user.id, student_id, university_id, major || null]
);

// Return updated profile + universities
const [updated] = await db.execute(
    `SELECT sp.user_id, sp.student_id, sp.university_id, u.first_name, u.last_name, u.email, sp.major, sp.total_verified_hours, uni.name as university_name
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    LEFT JOIN universities uni ON sp.university_id = uni.id
    WHERE sp.user_id = ? LIMIT 1`,
    [user.id]
    );

    const [unis] = await db.execute(`SELECT id, name FROM universities ORDER BY name ASC`);
    
    return new Response(JSON.stringify({ profile: updated[0], universities: unis, message: 'Student profile saved' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

} catch (error) {
    console.error('Error saving student profile:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}