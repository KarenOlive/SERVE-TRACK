// app/api/admin/notifications/route.js
import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin' && user.userType !== 'university_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [notifications] = await db.execute(`
      SELECT an.*, sp.user_id as profile_id, sp.organization_name, sp.contact_phone, sp.organization_description, sp.address, sp.website
      FROM admin_notifications an
      LEFT JOIN sites_profiles sp ON an.entity_id = sp.user_id
      WHERE an.is_read = 0
      ORDER BY an.created_at DESC
    `);

    return new Response(JSON.stringify({ notifications }), { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
