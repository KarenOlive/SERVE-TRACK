import db from '../../../../lib/database';
import { getCurrentUser, userHasRole, isAnyAdmin, getUniversityAdminDetails } from '../../../../lib/auth';
import updateSiteVerification from '@/lib/updateSiteVerification';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);

    // Allow both system admins and university admins
    if (!user || !(await isAnyAdmin(user.id))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [rows] = await db.execute(`
      SELECT 
        sp.user_id as profile_id,
        sp.user_id,
        u.email,
        sp.organization_name,
        sp.location,
        sp.website,
        sp.contact_phone,
        sp.verification_status,
        sp.rejection_reason,
        sp.updated_at
      FROM sites_profiles sp
      JOIN users u ON sp.user_id = u.id
      ORDER BY 
        CASE 
          WHEN sp.verification_status = 'pending' THEN 1
          WHEN sp.verification_status = 'unverified' THEN 2
          WHEN sp.verification_status = 'rejected' THEN 3
          ELSE 4
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

    // Allow both system admins and university admins
    if (!user || !(await isAnyAdmin(user.id))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // If user is a university admin, verify they have permission to manage nonprofits
    if (await userHasRole(user.id, 'university_admin')) {
      const universityDetails = await getUniversityAdminDetails(user.id);
      
      if (!universityDetails || !universityDetails.can_manage_nonprofits) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to manage nonprofits' }),
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { profile_id, user_id, action, rejection_reason } = body;

    if (!action || !['approve', 'reject', 'pending'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    const identifier = profile_id || user_id;
    const by = profile_id ? 'profile' : 'user';
    if (!identifier) {
      return new Response(JSON.stringify({ error: 'Missing profile_id or user_id' }), { status: 400 });
    }

    // Update verification using centralized helper
    const status = await updateSiteVerification({
      profileIdentifier: identifier,
      by,
      action,
      rejectionReason: rejection_reason || null
    });

    // Mark related admin notifications as read
    const [profileRow] = await db.execute(
      'SELECT user_id FROM sites_profiles WHERE user_id = ? LIMIT 1',
      [identifier, identifier]
    );

    if (profileRow && profileRow[0]) {
      await db.execute(
        'UPDATE admin_notifications SET is_read = 1 WHERE entity_id = ?',
        [profileRow[0].id]
      );
    }

    return new Response(JSON.stringify({ message: `Verification ${status} successfully.` }), { status: 200 });
  } catch (error) {
    console.error('Error updating verification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
