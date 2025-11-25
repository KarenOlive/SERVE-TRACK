import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get the opportunities where student has approved applications
    const [opportunities] = await db.execute(
      `SELECT 
        o.id,
        o.title,
        o.description,
        sp.organization_name,
        sp.location
      FROM opportunities o
      INNER JOIN applications a ON o.id = a.opportunity_id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      WHERE a.student_id = ? AND a.status = 'approved'
        AND o.status = 'active'
      ORDER BY o.title`,
      [user.id]
    );

    return new Response(
      JSON.stringify({ opportunities }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching student opportunities for hours:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}