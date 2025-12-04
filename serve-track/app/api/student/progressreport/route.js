import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'student') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Fetch student's applications with progress data
    const [applications] = await db.execute(
      `SELECT 
        a.*,
        o.title as opportunity_title,
        o.start_date,
        o.end_date,
        sp.organization_name,
        u.first_name,
        u.last_name,
        uni.name as university_name,
        uni.required_hours as university_required_hours,
        stp.student_id,
        stp.major,
        (SELECT SUM(hours) FROM hour_logs WHERE student_id = a.student_id AND opportunity_id = a.opportunity_id AND status = 'verified') as total_verified_hours
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN sites_profiles sp ON o.site_id = sp.user_id
      JOIN users u ON a.student_id = u.id
      JOIN student_profiles stp ON u.id = stp.user_id
      JOIN universities uni ON stp.university_id = uni.id
      WHERE a.student_id = ? AND a.status != 'withdrawn'  -- Exclude withdrawn applications
      ORDER BY a.applied_at DESC`,
      [user.id]
    );

    // Convert DECIMAL fields to numbers and ensure they have proper values
    const processedApplications = applications.map(app => {
        // Convert DECIMAL fields from string to number
        const hoursCompleted = parseFloat(app.hours_completed) || 0;
        const universityRequiredHours = parseFloat(app.university_required_hours) || 0;
        const totalVerifiedHours = parseFloat(app.total_verified_hours) || 0;
        
        // Update hours_completed in database if not set or different from verified hours
        const effectiveHours = hoursCompleted || totalVerifiedHours;
        
        return {
          ...app,
          // Ensure all numeric fields are numbers, not strings
          hours_completed: effectiveHours,
          university_required_hours: universityRequiredHours,
          total_verified_hours: totalVerifiedHours,
          // Convert boolean fields from tinyint to boolean
          site_manager_verified: Boolean(app.site_manager_verified),
          university_admin_verified: Boolean(app.university_admin_verified),
        };
    });



    // Update hours_completed in database if needed
    for (const application of processedApplications) {
      if (!application.hours_completed && application.total_verified_hours > 0) {
        await db.execute(
          `UPDATE applications SET hours_completed = ? WHERE id = ?`,
          [application.total_verified_hours, application.id]
        );
      }
    }

    return new Response(
        JSON.stringify({ 
          applications: processedApplications
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
    );

  } catch (error) {
    console.error('Get student progress error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}