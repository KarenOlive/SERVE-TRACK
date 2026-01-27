import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'university_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await request.json(); // 'verify' or 'reject'

    // Get university admin's university
    const [adminDetails] = await db.execute(
      `SELECT ua.university_id, u.required_hours
       FROM university_admins ua
       JOIN universities u ON ua.university_id = u.id
       WHERE ua.user_id = ?`,
      [user.id]
    );

    if (adminDetails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'University admin not found' }),
        { status: 404 }
      );
    }

    const universityId = adminDetails[0].university_id;
    const universityRequiredHours = adminDetails[0].required_hours;

    // Get application with student and university details
    const [applications] = await db.execute(
      `SELECT 
        a.*,
        o.title as opportunity_title,
        o.required_hours as opportunity_required_hours,
        sp.organization_name,
        u.first_name,
        u.last_name,
        stp.university_id,
        uni.name as university_name
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       JOIN users u ON a.student_id = u.id
       JOIN student_profiles stp ON u.id = stp.user_id
       JOIN universities uni ON stp.university_id = uni.id
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       WHERE a.id = ? AND stp.university_id = ?`,
      [id, universityId]
    );

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Application not found or not from your university' }),
        { status: 404 }
      );
    }

    const application = applications[0];

    // Check if site manager has verified
    if (!application.site_manager_verified) {
      return new Response(
        JSON.stringify({ error: 'Site manager has not verified the hours yet' }),
        { status: 400 }
      );
    }

    // Check if student has met university's required hours
    if (application.hours_completed < universityRequiredHours) {
      return new Response(
        JSON.stringify({ 
          error: 'Student has not met university required hours',
          completed: application.hours_completed,
          required: universityRequiredHours,
          difference: universityRequiredHours - application.hours_completed
        }),
        { status: 400 }
      );
    }

    // Update university admin verification
    if (action === 'verify') {
      await db.execute(
        `UPDATE applications 
         SET university_admin_verified = TRUE,
             hours_verified_at = NOW()
         WHERE id = ?`,
        [id]
      );

      return new Response(
        JSON.stringify({ 
          message: 'Application verified by university admin successfully'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else if (action === 'reject') {
      await db.execute(
        `UPDATE applications 
         SET university_admin_verified = FALSE,
             hours_verified_at = NULL
         WHERE id = ?`,
        [id]
      );

      return new Response(
        JSON.stringify({ 
          message: 'Application verification rejected by university admin'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('University admin verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'university_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = params;

    // Get university admin's university
    const [adminDetails] = await db.execute(
      `SELECT university_id FROM university_admins WHERE user_id = ?`,
      [user.id]
    );

    if (adminDetails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'University admin not found' }),
        { status: 404 }
      );
    }

    const universityId = adminDetails[0].university_id;

    // Get application details with hour logs
    const [applications] = await db.execute(
      `SELECT 
        a.*,
        o.title as opportunity_title,
        o.start_date,
        o.end_date,
        o.required_hours as opportunity_required_hours,
        sp.organization_name,
        u.first_name,
        u.last_name,
        u.email,
        stp.student_id,
        stp.major,
        uni.name as university_name,
        uni.required_hours as university_required_hours,
        (SELECT SUM(hours) FROM hour_logs WHERE student_id = a.student_id AND opportunity_id = a.opportunity_id AND status = 'verified') as total_verified_hours
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       JOIN users u ON a.student_id = u.id
       JOIN student_profiles stp ON u.id = stp.user_id
       JOIN universities uni ON stp.university_id = uni.id
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       WHERE a.id = ? AND stp.university_id = ?`,
      [id, universityId]
    );

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404 }
      );
    }

    const application = applications[0];

    // Get detailed hour logs for this application
    const [hourLogs] = await db.execute(
      `SELECT 
        hl.*,
        u.first_name as verified_by_first,
        u.last_name as verified_by_last
       FROM hour_logs hl
       LEFT JOIN users u ON hl.verified_by = u.id
       WHERE hl.student_id = ? AND hl.opportunity_id = ? AND hl.status = 'verified'
       ORDER BY hl.date_worked DESC`,
      [application.student_id, application.opportunity_id]
    );

    return new Response(
      JSON.stringify({ 
        application,
        hourLogs,
        verificationStatus: {
          siteManagerVerified: application.site_manager_verified,
          universityAdminVerified: application.university_admin_verified,
          hoursCompleted: application.hours_completed,
          universityRequiredHours: application.university_required_hours,
          opportunityRequiredHours: application.opportunity_required_hours,
          totalVerifiedHours: application.total_verified_hours,
          meetsUniversityRequirements: application.hours_completed >= application.university_required_hours
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get application details error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}