import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [notifications] = await db.execute(`
      SELECT an.*, s.organization_name, s.contact_email, s.description, s.address, s.website
      FROM admin_notifications an
      LEFT JOIN sites s ON an.entity_id = s.id
      WHERE an.is_read = 0
      ORDER BY an.created_at DESC
    `);

    return new Response(JSON.stringify({ notifications }), { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}