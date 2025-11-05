import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'

    let query = `
      SELECT 
        a.*,
        o.title as opportunity_title,
        u.first_name,
        u.last_name,
        u.email,
        sp.student_id,
        sp.major,
        un.name as university_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN universities un ON sp.university_id = un.id
      WHERE o.site_id = ?
    `;

    const params = [user.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.applied_at DESC';

    const [applications] = await db.execute(query, params);

    // Get application counts by status
    const [counts] = await db.execute(
      `SELECT 
        a.status,
        COUNT(*) AS count
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE o.site_id = ?
      GROUP BY a.status`,
      [user.id]
    );

    return new Response(
      JSON.stringify({ 
        applications,
        counts: counts.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {})
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );


  } catch (error) {
    console.error('Get applications error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}