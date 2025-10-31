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
    const status = searchParams.get('status') || 'pending';

    const [hourLogs] = await db.execute(
      `SELECT 
        hl.*,
        o.title as opportunity_title,
        u.first_name,
        u.last_name,
        u.email,
        sp.student_id,
        un.name as university_name
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       JOIN users u ON hl.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN universities un ON sp.university_id = un.id
       WHERE o.site_id = ? AND hl.status = ?
       ORDER BY hl.created_at DESC`,
      [user.id, status]
    );

    // Get verification queue counts
    const [counts] = await db.execute(
      `SELECT 
        hl.status,
        COUNT(*) as count
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       WHERE o.site_id = ?
       GROUP BY hl.status`,
      [user.id]
    );

    return new Response(
      JSON.stringify({ 
        hourLogs,
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
    console.error('Get verification queue error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}