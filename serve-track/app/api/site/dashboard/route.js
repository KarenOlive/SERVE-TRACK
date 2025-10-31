import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get organization profile
    const [orgProfiles] = await db.execute(
      `SELECT * FROM sites_profiles WHERE user_id = ?`,
      [user.id]
    );

    if (orgProfiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Organization profile not found' }),
        { status: 404 }
      );
    }

    const orgProfile = orgProfiles[0];

    // Get total volunteers count
    const [volunteerStats] = await db.execute(
      `SELECT COUNT(DISTINCT student_id) as total_volunteers
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE o.site_id = ? AND a.status = 'approved'`,
      [user.id]
    );

    // Get pending applications count
    const [applicationStats] = await db.execute(
      `SELECT COUNT(*) as pending_count
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE o.site_id = ? AND a.status = 'pending'`,
      [user.id]
    );

    // Get hours this month
    const [hourStats] = await db.execute(
      `SELECT COALESCE(SUM(hl.hours), 0) as hours_this_month
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       WHERE o.site_id = ? AND hl.status = 'verified' 
       AND MONTH(hl.created_at) = MONTH(CURRENT_DATE())
       AND YEAR(hl.created_at) = YEAR(CURRENT_DATE())`,
      [user.id]
    );

    // Get active opportunities count
    const [opportunityStats] = await db.execute(
      `SELECT COUNT(*) as active_count
       FROM opportunities
       WHERE site_id = ? AND status = 'active'`,
      [user.id]
    );

    // Get recent activity
    const [recentActivity] = await db.execute(
      `SELECT 
        'application' as type,
        CONCAT('New application for ', o.title) as message,
        a.applied_at as timestamp,
        a.status,
        '📨' as icon
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE o.site_id = ?
       
       UNION ALL
       
       SELECT 
        'hour_submission' as type,
        CONCAT('Hours submitted by ', u.first_name, ' ', u.last_name) as message,
        hl.created_at as timestamp,
        hl.status,
        '⏱️' as icon
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       JOIN users u ON hl.student_id = u.id
       WHERE o.site_id = ?
       
       ORDER BY timestamp DESC
       LIMIT 10`,
      [user.id, user.id]
    );

    // Get top volunteers this month
    const [topVolunteers] = await db.execute(
      `SELECT 
        u.first_name,
        u.last_name,
        u2.name as university_name,
        SUM(hl.hours) as total_hours
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       JOIN users u ON hl.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN universities u2 ON sp.university_id = u2.id
       WHERE o.site_id = ? AND hl.status = 'verified'
       AND MONTH(hl.created_at) = MONTH(CURRENT_DATE())
       AND YEAR(hl.created_at) = YEAR(CURRENT_DATE())
       GROUP BY u.id, u.first_name, u.last_name, u2.name
       ORDER BY total_hours DESC
       LIMIT 5`,
      [user.id]
    );

    const stats = {
      totalVolunteers: volunteerStats[0]?.total_volunteers || 0,
      pendingApplications: applicationStats[0]?.pending_count || 0,
      hoursThisMonth: parseFloat(hourStats[0]?.hours_this_month || 0),
      activeOpportunities: opportunityStats[0]?.active_count || 0
    };

    return new Response(
      JSON.stringify({
        stats,
        recentActivity: recentActivity.map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.timestamp)
        })),
        topVolunteers: topVolunteers.map(volunteer => ({
          firstName: volunteer.first_name,
          lastName: volunteer.last_name,
          universityName: volunteer.university_name,
          hours: parseFloat(volunteer.total_hours || 0)
        })),
        orgProfile
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Nonprofit dashboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}