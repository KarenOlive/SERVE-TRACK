import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const university = searchParams.get('university') || '';
    const timeRange = searchParams.get('timeRange') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build base query
    let query =
      `SELECT 
        hl.*,
        o.title as opportunity_title,
        u.first_name,
        u.last_name,
        u.email,
        sp.student_id,
        un.name as university_name,
        un.id as university_id
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       JOIN users u ON hl.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN universities un ON sp.university_id = un.id
       WHERE o.site_id = ? AND hl.status = ?`;
      
       const queryParams = [user.id, status];

       // Add university filter
       if (university) {
         query += ` AND un.id = ?`;
         queryParams.push(university);
       }
   
       // Add time range filter
       if (timeRange === 'week') {
         query += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)`;
       } else if (timeRange === 'month') {
         query += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
       }
   
       // Validate and apply sorting
       const validSortFields = ['created_at', 'date_worked', 'hours', 'first_name', 'last_name'];
       const validSortOrders = ['asc', 'desc'];
       
       const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
       const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
   
       query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
   
       // Add pagination using template literals for LIMIT and OFFSET
       query += ` LIMIT ${limit} OFFSET ${offset}`;

   
       const [hourLogs] = await db.execute(query, queryParams);
   
       // Get total count for pagination
       let countQuery = `
         SELECT COUNT(*) as total
         FROM hour_logs hl
         JOIN opportunities o ON hl.opportunity_id = o.id
         JOIN users u ON hl.student_id = u.id
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         LEFT JOIN universities un ON sp.university_id = un.id
         WHERE o.site_id = ? AND hl.status = ?
       `;
   
       const countParams = [user.id, status];
   
       if (university) {
         countQuery += ` AND un.id = ?`;
         countParams.push(university);
       }
   
       if (timeRange === 'week') {
         countQuery += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)`;
       } else if (timeRange === 'month') {
         countQuery += ` AND hl.date_worked >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
       }
   
       const [countResult] = await db.execute(countQuery, countParams);
       const totalCount = countResult[0].total;
       const totalPages = Math.ceil(totalCount / limit);
    

    // Get verification queue counts for all statuses
    const [counts] = await db.execute(
      `SELECT 
        hl.status,
        COUNT(*) as count
       FROM hour_logs hl
       JOIN opportunities o ON hl.opportunity_id = o.id
       WHERE o.site_id = ?
       GROUP BY hl.status`,
      [user.id]
    );
    
      // Get unique universities for filter dropdown
      const [universities] = await db.execute(
        `SELECT DISTINCT 
          un.id,
          un.name
         FROM hour_logs hl
         JOIN opportunities o ON hl.opportunity_id = o.id
         JOIN users u ON hl.student_id = u.id
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         LEFT JOIN universities un ON sp.university_id = un.id
         WHERE o.site_id = ? AND un.id IS NOT NULL
         ORDER BY un.name`,
        [user.id]
      );

    return new Response(
      JSON.stringify({ 
        hourLogs,
        counts: counts.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        universities: universities || [],
        filters: {
          status,
          university,
          timeRange,
          sortBy,
          sortOrder
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get verification queue error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}