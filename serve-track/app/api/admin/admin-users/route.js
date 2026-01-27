import db from '@/lib/database';
import { getCurrentUser, userHasRole, getUniversityAdminDetails } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let connection;
  try {
    const currentUser = getCurrentUser(request);
    
    // Check if user is authorized to create admins
    const isSystemAdmin = await userHasRole(currentUser.id, 'admin');
    const isUniversityAdmin = await userHasRole(currentUser.id, 'university_admin');
      
    if (!currentUser || (!isSystemAdmin && !isUniversityAdmin)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, // 'admin' or 'university_admin'
      universityId, // only for university admins
      permissions // { can_manage_nonprofits, can_manage_students, can_manage_admins }
    } = await request.json();
    
    // Validate permissions based on user type
    if (isUniversityAdmin) {
      // University admins can only create university admins for their university
      if (role !== 'university_admin') {
        return new Response(
          JSON.stringify({ error: 'University admins can only create other university admins' }),
          { status: 400 }
        );
      }

      // University admins can only assign their own university
      const universityDetails = await getUniversityAdminDetails(currentUser.id);
      if (universityId !== universityDetails.university_id) {
        return new Response(
          JSON.stringify({ error: 'You can only create admins for your own university' }),
          { status: 400 }
        );
      }

      // University admins must have permission to manage other admins
      if (!universityDetails.can_manage_admins) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to create other admins' }),
          { status: 403 }
        );
      }
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400 }
      );
    }

    // Validate university admin data
    if (role === 'university_admin' && !universityId) {
      return new Response(
        JSON.stringify({ error: 'University ID is required for university admins' }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Get a connection from the pool for transaction
    connection = await db.getConnection();
    
    // Start transaction using connection (not prepared statement)
    await connection.query('START TRANSACTION');

    try {
      // Create new user - using UUID() for id
      const [userResult] = await connection.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, profile_complete, created_at)
         VALUES (UUID(), ?, ?, ?, ?, 1, NOW())`,
        [email, hashedPassword, firstName, lastName]
      );

      // Get the inserted user's ID
      const [newUser] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (newUser.length === 0) {
        throw new Error('Failed to retrieve created user');
      }

      const userId = newUser[0].id;

      // Get role ID based on role name
      const [roleRows] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        [role]
      );

      if (roleRows.length === 0) {
        throw new Error(`Role ${role} not found`);
      }

      const roleId = roleRows[0].id;

      // Assign role to user
      await connection.execute(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES (?, ?, NOW())`,
        [userId, roleId]
      );

      // If it's a university admin, create university admin record
      if (role === 'university_admin' && universityId) {
        await connection.execute(
          `INSERT INTO university_admins (user_id, university_id, can_manage_nonprofits, can_manage_students, can_manage_admins)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId, 
            universityId, 
            permissions?.can_manage_nonprofits ? 1 : 0, 
            permissions?.can_manage_students ? 1 : 0, 
            permissions?.can_manage_admins ? 1 : 0, 
            // University admins created by other university admins cannot manage admins by default
          ]
        );
      }

      await connection.query('COMMIT');

      return new Response(
        JSON.stringify({ 
          message: `${role === 'university_admin' ? 'University admin' : 'System admin'} created successfully`,
          userId 
        }),
        { status: 201 }
      );
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), 
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


  // Get all admin users (both system and university admins)
  export async function GET(request) {
  try {
    const currentUser = getCurrentUser(request);
    
    // Check if user is authorized to view admin users
    const isSystemAdmin = await userHasRole(currentUser.id, 'admin');
    const isUniversityAdmin = await userHasRole(currentUser.id, 'university_admin');
    
    if (!currentUser || (!isSystemAdmin && !isUniversityAdmin)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.created_at,
        r.name as role,
        ua.university_id,
        univ.name as university_name,
        ua.can_manage_nonprofits,
        ua.can_manage_students,
        ua.can_manage_admins
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN university_admins ua ON u.id = ua.user_id
       LEFT JOIN universities univ ON ua.university_id = univ.id
       WHERE r.name IN ('admin', 'university_admin')
    `;

    const params = [];

    // If university admin, only show admins from their university
    if (isUniversityAdmin) {
      const universityDetails = await getUniversityAdminDetails(currentUser.id);
      if (universityDetails) {
        // Only show university admins from the same university, NOT system admins
        query += ` AND r.name = 'university_admin' AND ua.university_id = ?`;
        params.push(universityDetails.university_id);
      } else {
        // If no university details, show nothing
        query += ` AND 1 = 0`; // This will return no results
      }
    }

    query += `
       ORDER BY 
         CASE 
           WHEN r.name = 'admin' THEN 1
           WHEN r.name = 'university_admin' THEN 2
         END,
         univ.name, 
         u.created_at DESC`;

    const [adminUsers] = await db.execute(query, params);

  // Get universities for dropdown
    let universities = [];
    if (isSystemAdmin) {
      // System admins can see all universities
      [universities] = await db.execute(
        `SELECT id, name, code FROM universities ORDER BY name`
      );
    } else if (isUniversityAdmin) {
      // University admins can only see their own university
      const universityDetails = await getUniversityAdminDetails(currentUser.id);
      if (universityDetails) {
        [universities] = await db.execute(
          `SELECT id, name, code FROM universities WHERE id = ?`,
          [universityDetails.university_id]
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        admins: adminUsers,
        universities 
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}