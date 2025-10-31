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

    if (!['verified', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400 }
      );
    }

    // Verify the hour log belongs to this nonprofit's opportunity
    const [hourLogs] = await db.execute(
      `SELECT hl.* 
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       WHERE hl.id = ? AND o.site_id = ?`,
      [id, user.id]
    );

    if (hourLogs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Hour log not found' }),
        { status: 404 }
      );
    }

    // Update hour log status
    await db.execute(
      `UPDATE hour_logs 
       SET status = ?, verified_at = NOW(), verified_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [status, user.id, rejectionReason || null, id]
    );

    // If verified, update student's total verified hours
    if (status === 'verified') {
      const hourLog = hourLogs[0];
      await db.execute(
        `UPDATE student_profiles 
         SET total_verified_hours = COALESCE(total_verified_hours, 0) + ?
         WHERE user_id = ?`,
        [hourLog.hours, hourLog.student_id]
      );
    }

    return new Response(
      JSON.stringify({ 
        message: `Hours ${status} successfully`
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update hour log error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}