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
    const body = await request.json();
    const status = body.status?.toLowerCase();
    const rejectionReason = body.rejectionReason || null;

    if (!['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400 }
      );
    }

    // Verify that this application belongs to this nonprofit
    const [applications] = await db.execute(
      `SELECT a.id 
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.id = ? AND o.site_id = ?`,
      [id, user.id]
    );

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Application not found or unauthorized' }),
        { status: 404 }
      );
    }

    // Update application status and clear rejection reason when approved
    await db.execute(
      `UPDATE applications 
       SET 
         status = ?, 
         reviewed_at = NOW(), 
         reviewed_by = ?, 
         rejection_reason = ?
       WHERE id = ?`,
      [
        status,
        user.id,
        status === 'rejected' ? rejectionReason : null,
        id
      ]
    );

    // Optionally return the updated record
    const [updated] = await db.execute(
      `SELECT 
         a.id,
         a.status,
         a.reviewed_at,
         a.rejection_reason,
         a.opportunity_id
       FROM applications a
       WHERE a.id = ?`,
      [id]
    );

    return new Response(
      JSON.stringify({ 
        message: `Application ${status} successfully`,
        application: updated[0]
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