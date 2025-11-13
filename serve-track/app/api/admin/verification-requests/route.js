import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [rows] = await db.execute(`
      SELECT 
        u.id AS user_id,
        u.email,
        u.verification_status,
        sp.organization_name,
        sp.location,
        sp.website,
        sp.contact_phone,
        sp.updated_at
      FROM users u
      JOIN sites_profiles sp ON u.id = sp.user_id
      WHERE u.userType = 'nonprofit'
      ORDER BY 
        CASE 
          WHEN u.verification_status = 'pending' THEN 1
          WHEN u.verification_status = 'unverified' THEN 2
          ELSE 3
        END,
        sp.updated_at DESC
    `);

    return new Response(JSON.stringify({ requests: rows }), { status: 200 });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    await db.execute(
      `UPDATE users SET verification_status = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, user_id]
    );

    return new Response(
      JSON.stringify({ message: `Verification ${newStatus} successfully.` }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating verification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
