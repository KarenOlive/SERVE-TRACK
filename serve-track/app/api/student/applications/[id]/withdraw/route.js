import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id: applicationId } = await params;
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if application exists and belongs to student
    const [applications] = await db.execute(
      `SELECT id FROM applications WHERE id = ? AND student_id = ?`,
      [applicationId, user.id]
    );

    if (!applications || applications.length === 0) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
    }

    // Update application status to withdrawn
    await db.execute(
      `UPDATE applications SET status = 'withdrawn', reviewed_at = NOW() WHERE id = ?`,
      [applicationId]
    );

    // Get updated application
    const [updatedApplications] = await db.execute(
      `SELECT 
        a.id,
        a.status,
        a.applied_at,
        a.reviewed_at,
        o.title as opportunity_title,
        sp.organization_name
      FROM applications a
      INNER JOIN opportunities o ON a.opportunity_id = o.id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      WHERE a.id = ?`,
      [applicationId]
    );

    return new Response(
      JSON.stringify({ 
        message: 'Application withdrawn successfully',
        application: updatedApplications[0]
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error withdrawing application:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}