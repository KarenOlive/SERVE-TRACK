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
    let approvalQuery = `SELECT COUNT(*) as pending_approvals FROM sites_profiles WHERE verification_status = 'pending'`;
    let userQuery = `SELECT COUNT(*) as total_users FROM users`;
    let orgQuery;

     // Add university filter for university admins
     if (isUniversityAdmin && universityId) {
      studentQuery += ` WHERE university_id = ?`;
      //Count organizations that are verified and either:
      // 1. Have opportunities with applications from this university's students, OR
      // 2. Are available to this university
      orgQuery = `
      SELECT COUNT(DISTINCT sp.user_id) as total_organizations
      FROM sites_profiles sp
      WHERE sp.verification_status = 'verified'
      AND EXISTS (
        SELECT 1 FROM opportunities o 
        WHERE o.site_id = sp.user_id
        AND EXISTS (
          SELECT 1 FROM applications a 
          JOIN student_profiles st ON a.student_id = st.user_id 
          WHERE a.opportunity_id = o.id 
          AND st.university_id = ?
        )
      )
    `;
      // For university admins, show pending approvals for organizations related to their university
      approvalQuery = `
      SELECT COUNT(DISTINCT sp.user_id) as pending_approvals
      FROM sites_profiles sp
      JOIN opportunities o ON sp.user_id = o.site_id
      JOIN applications a ON o.id = a.opportunity_id  
      JOIN student_profiles st ON a.student_id = st.user_id
      WHERE st.university_id = ?
      AND sp.verification_status = 'pending'
      `; 
    }else {
      // For super admins: count all verified organizations
      orgQuery = `SELECT COUNT(*) as total_organizations FROM sites_profiles WHERE verification_status = 'verified'`;
    }
    
    // Get total students count
    const [studentStats] = isUniversityAdmin && universityId 
    ? await db.execute(studentQuery, [universityId])
    : await db.execute(studentQuery);

    // Get partnerOrganizations count
    const [orgStats] = isUniversityAdmin && universityId 
    ? await db.execute(orgQuery, [universityId])
    : await db.execute(orgQuery);

    // Get pending approvals (organizations waiting for verification)
    const [approvalStats] = isUniversityAdmin && universityId 
    ? await db.execute(approvalQuery, [universityId])
    : await db.execute(approvalQuery);

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

  const activityParams = [];

  // Add university filter for recent activity if university admin
  if (isUniversityAdmin && universityId) {
  recentActivityQuery += ` AND (stp.university_id = ? OR sp.user_id IS NOT NULL)`;
  activityParams.push(universityId);

  }

  recentActivityQuery += `
  UNION ALL

  -- Site approval requests and actions
  SELECT 
    'verification' as type,
    CASE 
      WHEN verification_status = 'pending' THEN CONCAT('Approval requested: ', organization_name)
      WHEN verification_status = 'verified' THEN CONCAT('Organization verified: ', organization_name)
      WHEN verification_status = 'rejected' THEN CONCAT('Organization rejected: ', organization_name)
      ELSE CONCAT('Verification status updated: ', organization_name)
    END as message,
    COALESCE(updated_at, created_at) as timestamp,
    verification_status as status,
    CASE 
      WHEN verification_status = 'pending' THEN '⏳'
      WHEN verification_status = 'verified' THEN '✅'
      WHEN verification_status = 'rejected' THEN '❌'
      ELSE '📝'
    END as icon
  FROM sites_profiles
  WHERE (verification_status = 'pending' OR updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))`;

  // Add university admin creation activity
  let universityAdminQuery = `
  UNION ALL

  -- University admin creation
  SELECT 
    'university_admin' as type,
    CONCAT('New university admin created: ', u.first_name, ' ', u.last_name) as message,
    u.created_at as timestamp,
    'created' as status,
    '👨‍⚖️' as icon
  FROM university_admins ua
  JOIN users u ON ua.user_id = u.id
  WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;

  const universityAdminParams = [];

  // Add university filter for university admin activities
  if (isUniversityAdmin && universityId) {
    universityAdminQuery += ` AND ua.university_id = ?`;
    universityAdminParams.push(universityId);
  }

  recentActivityQuery += universityAdminQuery;

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

// Combine all parameters for the activity query
const allActivityParams = [...activityParams, ...universityAdminParams];
    
const [recentActivity] = allActivityParams.length > 0 
  ? await db.execute(recentActivityQuery, allActivityParams)
  : await db.execute(recentActivityQuery);

    const stats = {
      totalStudents: studentStats[0]?.total_students || 0,
      totalOrganizations: orgStats[0]?.total_organizations || 0,
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