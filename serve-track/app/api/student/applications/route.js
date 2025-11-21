import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [applications] = await db.execute(
      `SELECT 
        a.id,
        a.status,
        a.applied_at,
        a.reviewed_at,
        o.title as opportunity_title,
        o.description as opportunity_description,
        o.start_date,
        o.end_date,
        o.estimated_hours,
        sp.organization_name,
        sp.location,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name
      FROM applications a
      INNER JOIN opportunities o ON a.opportunity_id = o.id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      LEFT JOIN users u ON a.reviewed_by = u.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC`,
      [user.id]
    );

    return new Response(
      JSON.stringify({ applications }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching student applications:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}