import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = params;
    const { status, rejectionReason } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400 }
      );
    }

    // Verify the application belongs to this nonprofit's opportunity
    const [applications] = await db.execute(
      `SELECT a.* 
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.id = ? AND o.site_id = ?`,
      [id, user.id]
    );

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404 }
      );
    }

    // Update application status
    await db.execute(
      `UPDATE applications 
       SET status = ?, reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [status, user.id, rejectionReason || null, id]
    );

    return new Response(
      JSON.stringify({ 
        message: `Application ${status} successfully`
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update application error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}