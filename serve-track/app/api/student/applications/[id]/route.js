import db from '@/lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    const { id: applicationId } = await params;
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [applications] = await db.execute(
      `SELECT 
        a.id,
        a.status,
        a.applied_at,
        a.reviewed_at,
        a.reviewed_by,
        o.id as opportunity_id,
        o.title as opportunity_title,
        o.description as opportunity_description,
        o.start_date,
        o.end_date,
        o.estimated_hours,
        o.volunteers_needed,
        sp.organization_name,
        sp.location,
        sp.contact_phone,
        sp.website,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        sp.user_id as organization_id
      FROM applications a
      INNER JOIN opportunities o ON a.opportunity_id = o.id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      LEFT JOIN users u ON a.reviewed_by = u.id
      WHERE a.id = ? AND a.student_id = ?`,
      [applicationId, user.id]
    );

    if (!applications || applications.length === 0) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
    }

    // Get communication log (if we had a messages table)
    // For now, we'll return an empty array as placeholder
    const communicationLog = [];

    return new Response(
      JSON.stringify({ 
        application: applications[0],
        communicationLog 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching application details:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}