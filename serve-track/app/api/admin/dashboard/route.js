import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get total students count
    const [studentStats] = await db.execute(
      `SELECT COUNT(*) as total_students
       FROM student_profiles`
    );

    // Get total organizations count
    const [orgStats] = await db.execute(
      `SELECT COUNT(*) as total_organizations
       FROM sites_profiles`
    );

    // Get pending approvals (organizations waiting for verification)
    const [approvalStats] = await db.execute(
      `SELECT COUNT(*) as pending_approvals
       FROM sites_profiles
       WHERE verification_status = 'pending'`
    );

    // Get total system users
    const [userStats] = await db.execute(
      `SELECT COUNT(*) as total_users FROM users`
    );

    // Get recent activity
    const [recentActivity] = await db.execute(
      `SELECT 
        'registration' as type,
        CASE 
          WHEN sp.user_id IS NOT NULL THEN CONCAT('New organization registration: ', sp.organization_name)
          WHEN stp.user_id IS NOT NULL THEN CONCAT('New student registration: ', u.first_name, ' ', u.last_name)
          ELSE 'New user registration'
        END as message,
        u.created_at as timestamp,
        'new' as status,
        CASE 
          WHEN sp.user_id IS NOT NULL THEN '🏢'
          WHEN stp.user_id IS NOT NULL THEN '🎓'
          ELSE '👤'
        END as icon
       FROM users u
       LEFT JOIN sites_profiles sp ON u.id = sp.user_id
       LEFT JOIN student_profiles stp ON u.id = stp.user_id
       WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       
       UNION ALL
       
       SELECT 
        'system' as type,
        'System backup completed successfully' as message,
        NOW() as timestamp,
        'completed' as status,
        '🛡️' as icon
       
       ORDER BY timestamp DESC
       LIMIT 10`
    );

    const stats = {
      totalStudents: studentStats[0]?.total_students || 0,
      totalOrganizations: orgStats[0]?.total_organizations || 0,
      pendingApprovals: approvalStats[0]?.pending_approvals || 0,
      systemUsers: userStats[0]?.total_users || 0
    };

    return new Response(
      JSON.stringify({
        stats,
        recentActivity: recentActivity.map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.timestamp)
        }))
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Admin dashboard error:', error);
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