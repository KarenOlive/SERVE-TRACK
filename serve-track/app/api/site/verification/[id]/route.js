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

    const { id } = await params;
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

    const hourLog = hourLogs[0];

    // Get the previous status
    const [previousLog] = await db.execute(
      `SELECT status FROM hour_logs WHERE id = ?`,
      [id]
    );
    const previousStatus = previousLog[0]?.status;

    // Update hour log status
    await db.execute(
      `UPDATE hour_logs 
       SET status = ?, verified_at = NOW(), verified_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [status, user.id, rejectionReason || null, id]
    );

    // If verified, update student's total verified hours
    if (status === 'verified') {
      await db.execute(
        `UPDATE student_profiles 
         SET total_verified_hours = COALESCE(total_verified_hours, 0) + ?
         WHERE user_id = ?`,
        [hourLog.hours, hourLog.student_id]
      );
    } else if (previousStatus === 'verified' && status === 'rejected') {
      // If changing from verified to rejected, subtract the hours
      await db.execute(
        `UPDATE student_profiles 
         SET total_verified_hours = GREATEST(COALESCE(total_verified_hours, 0) - ?, 0)
         WHERE user_id = ?`,
        [hourLog.hours, hourLog.student_id]
      );
    }

    // Check if all hour logs for this application are verified
    if (status === 'verified') {
      const [hourSummary] = await db.execute(
        `SELECT 
        hl.student_id,
        hl.opportunity_id,
        SUM(CASE WHEN hl.status = 'verified' THEN hl.hours ELSE 0 END) as total_verified,
        uni.required_hours as university_required_hours
       FROM hour_logs hl
       JOIN student_profiles sp ON hl.student_id = sp.user_id
       JOIN universities uni ON sp.university_id = uni.id
       WHERE hl.student_id = ? AND hl.opportunity_id = ?
       GROUP BY hl.student_id, hl.opportunity_id, uni.required_hours`,
      [hourLog.student_id, hourLog.opportunity_id]
      );

      if (hourSummary.length > 0) {
        const summary = hourSummary[0];
        
        // Update the application's hours_completed
        await db.execute(
          `UPDATE applications 
           SET hours_completed = ?,
               updated_at = NOW()
           WHERE student_id = ? AND opportunity_id = ?`,
          [summary.total_verified, hourLog.student_id, hourLog.opportunity_id]
        );

        // Check if hours requirement is met (against university required hours) and mark site_manager_verified
        if (summary.total_verified >= summary.university_required_hours) {
          await db.execute(
            `UPDATE applications 
             SET site_manager_verified = TRUE,
                 hours_verified_at = NOW()
             WHERE student_id = ? AND opportunity_id = ?`,
            [hourLog.student_id, hourLog.opportunity_id]
          );
        }
      }
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