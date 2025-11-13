import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'nonprofit') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if profile is complete
    const [userRows] = await db.execute(
      'SELECT profile_complete FROM users WHERE id = ?',
      [user.id]
    );

    const userData = userRows[0];
    if (!userData || userData.profile_complete !== 1) {
      return new Response(
        JSON.stringify({ error: 'Please complete your profile before requesting verification.' }),
        { status: 400 }
      );
    }

    // Get organization profile info
    const [rows] = await db.execute(
      `SELECT organization_name, contact_phone, organization_description, address, location, verification_status 
       FROM sites_profiles WHERE user_id = ?`,
      [user.id]
    );

    const profile = rows[0];
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    if (profile.verification_status === 'pending') {
      return new Response(
        JSON.stringify({ error: 'Verification request already pending.' }),
        { status: 400 }
      );
    }

    if (profile.verification_status === 'verified') {
      return new Response(
        JSON.stringify({ error: 'Your organization is already verified.' }),
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE sites_profiles SET verification_status = 'pending', updated_at = NOW() WHERE user_id = ?`,
      [user.id]
    );

    await db.execute(
      `INSERT INTO admin_notifications (type, message, entity_id, created_at)
       VALUES ('verification_request', ?, ?, NOW())`,
      [`${profile.organization_name} requested verification`, user.id]
    );

    return new Response(
      JSON.stringify({ message: 'Verification request sent successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error requesting verification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
