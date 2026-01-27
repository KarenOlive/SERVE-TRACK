// app/api/admin/notifications/[id]/route.js
import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';
import updateSiteVerification from '@/lib/updateSiteVerification';

export async function PUT(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = params; // notification id
    const { action, profile_id, rejection_reason } = await request.json();

    if (!id || !action || !['approve', 'reject', 'pending'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
    }

    // mark notification as read
    await db.execute('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [id]);

    // update verification using centralized helper
    const status = await updateSiteVerification({
      profileIdentifier: profile_id,
      by: 'profile',
      action,
      rejectionReason: rejection_reason || null
    });

    return new Response(JSON.stringify({ message: `Verification ${status}` }), { status: 200 });
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
