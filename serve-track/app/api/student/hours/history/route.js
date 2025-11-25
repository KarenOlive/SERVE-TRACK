import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const range = searchParams.get('range') || 'all';

    // Build the base query
    let query = `
      SELECT 
        hl.id,
        hl.date_worked,
        hl.hours,
        hl.time_in,
        hl.time_out,
        hl.description,
        hl.status,
        hl.verified_at,
        hl.rejection_reason,
        hl.created_at,
        o.title as opportunity_title,
        sp.organization_name,
        u.first_name as verified_by_first_name,
        u.last_name as verified_by_last_name
      FROM hour_logs hl
      INNER JOIN opportunities o ON hl.opportunity_id = o.id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      LEFT JOIN users u ON hl.verified_by = u.id
      WHERE hl.student_id = ?
    `;

    const queryParams = [user.id];

    // Apply status filter
    if (filter !== 'all') {
      query += ` AND hl.status = ?`;
      queryParams.push(filter);
    }

    // Apply time range filter
    if (range === 'month') {
      query += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
    } else if (range === 'week') {
      query += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)`;
    }

    // Order by date (most recent first)
    query += ` ORDER BY hl.date_worked DESC, hl.created_at DESC`;

    const [hourLogs] = await db.execute(query, queryParams);

    // Get total hours by status
    let totalsQuery = `
      SELECT 
        status,
        SUM(hours) as total_hours,
        COUNT(*) as count
      FROM hour_logs 
      WHERE student_id = ?
    `;

    const totalsParams = [user.id];

    if (range === 'month') {
      totalsQuery += ` AND date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
    } else if (range === 'week') {
      totalsQuery += ` AND date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)`;
    }

    totalsQuery += ` GROUP BY status`;

    const [totals] = await db.execute(totalsQuery, totalsParams);

    return new Response(
      JSON.stringify({ 
        hourLogs,
        totals: totals || []
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching hour history:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}