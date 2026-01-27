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

    // Get student profile with university info
    const [studentProfiles] = await db.execute(
      `SELECT sp.*, u.required_hours, un.name as university_name
       FROM student_profiles sp
       LEFT JOIN universities u ON sp.university_id = u.id
       LEFT JOIN universities un ON sp.university_id = un.id
       WHERE sp.user_id = ?`,
      [user.id]
    );

    if (studentProfiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Student profile not found' }),
        { status: 404 }
      );
    }

    const studentProfile = studentProfiles[0];

    // Get total verified hours
    const [hourStats] = await db.execute(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'verified' THEN hours ELSE 0 END), 0) as verified_hours,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN hours ELSE 0 END), 0) as pending_hours
       FROM hour_logs 
       WHERE student_id = ?`,
      [user.id]
    );

    // Get pending applications count
    const [applicationStats] = await db.execute(
      `SELECT COUNT(*) as pending_count 
       FROM applications 
       WHERE student_id = ? AND status = 'pending'`,
      [user.id]
    );

    // Get recent activity
    const [recentActivity] = await db.execute(
      `SELECT 
        'application' as type,
        CONCAT('Applied to ', o.title) as message,
        a.applied_at as timestamp,
        a.status,
        '📝' as icon
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.student_id = ?
       
       UNION ALL
       
       SELECT 
        'hour_log' as type,
        CONCAT('Logged ', hl.hours, ' hours at ', o.title) as message,
        hl.created_at as timestamp,
        hl.status,
        CASE 
          WHEN hl.status = 'verified' THEN '✅'
          WHEN hl.status = 'rejected' THEN '❌'
          ELSE '⏱️'
        END as icon
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       WHERE hl.student_id = ?
       
       ORDER BY timestamp DESC
       LIMIT 10`,
      [user.id, user.id]
    );

    const stats = {
      requiredHours: studentProfile.required_hours || 40,
      completedHours: parseFloat(hourStats[0]?.verified_hours || 0),
      pendingApplications: applicationStats[0]?.pending_count || 0,
      verifiedHours: parseFloat(hourStats[0]?.verified_hours || 0),
      hoursNeeded: (studentProfile.required_hours || 40) - parseFloat(hourStats[0]?.verified_hours || 0)
    };

    return new Response(
      JSON.stringify({
        stats,
        recentActivity: recentActivity.map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.timestamp)
        })),
        studentProfile
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Student dashboard error:', error);
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