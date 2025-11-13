import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = params;
    const { action, entityId } = await request.json(); // 'approve' or 'reject'

    // Mark notification as read
    await db.execute(
      'UPDATE admin_notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    if (action === 'approve') {
      // Update site verification status
      await db.execute(
        'UPDATE sites SET verification_status = "verified" WHERE id = ?',
        [entityId]
      );
      
      return new Response(
        JSON.stringify({ message: 'Organization verified successfully' }),
        { status: 200 }
      );
    } else if (action === 'reject') {
      // Update site verification status
      await db.execute(
        'UPDATE sites SET verification_status = "rejected" WHERE id = ?',
        [entityId]
      );
      
      return new Response(
        JSON.stringify({ message: 'Organization verification rejected' }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}