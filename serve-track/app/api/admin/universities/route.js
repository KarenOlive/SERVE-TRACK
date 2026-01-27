import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || (user.userType !== 'admin' && user.userType !== 'university_admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let query = `
      SELECT 
        u.*,
        COUNT(DISTINCT sp.user_id) as student_count,
        COUNT(DISTINCT ua.user_id) as admin_count
      FROM universities u
      LEFT JOIN student_profiles sp ON u.id = sp.university_id
      LEFT JOIN university_admins ua ON u.id = ua.university_id
    `;

    // If university admin, only show their university
    if (user.userType === 'university_admin') {
      const [adminDetails] = await db.execute(
        `SELECT university_id FROM university_admins WHERE user_id = ?`,
        [user.id]
      );

      if (adminDetails.length === 0) {
        return new Response(JSON.stringify({ universities: [] }), { status: 200 });
      }

      const universityId = adminDetails[0].university_id;
      query += ` WHERE u.id = '${universityId}'`;
    }

    query += ` GROUP BY u.id ORDER BY u.name`;

    const [universities] = await db.execute(query);

    return new Response(
      JSON.stringify({ universities }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching universities:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
    try {
      const user = getCurrentUser(request);
      
      // Only system admins can create universities
      if (!user || user.userType !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
  
      const {
        name,
        code,
        required_hours,
        contact_email
        } = await request.json();
  
      // Validate required fields
      if (!name || !code) {
        return new Response(
          JSON.stringify({ error: 'University name and code are required' }),
          { status: 400 }
        );
      }
  
      // Check if code already exists
      const [existing] = await db.execute(
        'SELECT id FROM universities WHERE code = ?',
        [code.toUpperCase()]
      );
  
      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ error: 'University code already exists' }),
          { status: 400 }
        );
      }
  
      // Insert new university
      const [result] = await db.execute(
        `INSERT INTO universities (id, name, code, required_hours, contact_email, created_at)
         VALUES (UUID(), ?, ?, ?, ?, NOW())`,
        [name, code.toUpperCase(), required_hours, contact_email ]
      );
  
      // Get the newly created university
      const [newUniversity] = await db.execute(
        `SELECT * FROM universities WHERE id = ?`,
        [result.insertId]
      );
  
      return new Response(
        JSON.stringify({ 
          message: 'University created successfully',
          university: newUniversity[0]
        }),
        { status: 201 }
      );
  
    } catch (error) {
      console.error('Error creating university:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      );
    }
  }