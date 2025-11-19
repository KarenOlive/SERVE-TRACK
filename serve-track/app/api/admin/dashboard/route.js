import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'admin' && user.userType !== 'university_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // For university admins, we might want to show different data
    const isUniversityAdmin = user.userType === 'university_admin';

    // Get university admin details if applicable
    let universityId = null;
    if (isUniversityAdmin) {
      const [adminDetails] = await db.execute(
        `SELECT ua.university_id 
         FROM university_admins ua 
         WHERE ua.user_id = ?`,
        [user.id]
      );
      
      if (adminDetails.length > 0) {
        universityId = adminDetails[0].university_id;
      }
    }

    // Build queries based on user type
    let studentQuery = `SELECT COUNT(*) as total_students FROM student_profiles`;
    let orgQuery = `SELECT COUNT(*) as total_organizations FROM sites_profiles`;
    let approvalQuery = `SELECT COUNT(*) as pending_approvals FROM sites_profiles WHERE verification_status = 'pending'`;
    let userQuery = `SELECT COUNT(*) as total_users FROM users`;

     // Add university filter for university admins
     if (isUniversityAdmin && universityId) {
      studentQuery += ` WHERE university_id = '${universityId}'`;

      // For organizations, show those that have opportunities with students from this university
      orgQuery = `
        SELECT COUNT(DISTINCT sp.user_id) as total_organizations
        FROM sites_profiles sp
        JOIN opportunities o ON sp.user_id = o.site_id
        JOIN applications a ON o.id = a.opportunity_id
        JOIN student_profiles st ON a.student_id = st.user_id
        WHERE st.university_id = '${universityId}'
      `;
      approvalQuery = `
        SELECT COUNT(*) as pending_approvals 
        FROM sites_profiles 
        WHERE verification_status = 'pending'
      `; // University admins might not see all pending approvals
    }

     // Get total students count
    const [studentStats] = await db.execute(studentQuery);

    // Get partnerOrganizations count
    const [orgStats] = await db.execute(orgQuery);

    // Get pending approvals (organizations waiting for verification)
    const [approvalStats] = await db.execute(approvalQuery);

    // Get total system users
    const [userStats] = await db.execute(userQuery);

    // Get recent activity
      let recentActivityQuery = `
      SELECT 
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
       WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;

      // Add university filter for recent activity if university admin
       if (isUniversityAdmin && universityId) {
         recentActivityQuery += ` AND (stp.university_id = '${universityId}' OR sp.user_id IS NOT NULL)`;
       }
   
       recentActivityQuery += `
          UNION ALL
          
          SELECT 
           'system' as type,
           'System backup completed successfully' as message,
           NOW() as timestamp,
           'completed' as status,
           '🛡️' as icon
          
          ORDER BY timestamp DESC
          LIMIT 10
       `;
    
    const [recentActivity] = await db.execute(recentActivityQuery);


    const stats = {
      totalStudents: studentStats[0]?.total_students || 0,
      partnerOrganizations: orgStats[0]?.partner_organizations || 0,
      pendingApprovals: approvalStats[0]?.pending_approvals || 0,
      systemUsers: userStats[0]?.total_users || 0
    };

     // Add university-specific stats if applicable
     if (isUniversityAdmin) {
      stats.activeUsers = studentStats[0]?.total_students || 0;
    }

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