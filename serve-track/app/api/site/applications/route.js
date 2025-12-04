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
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    const university = searchParams.get('university');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'applied_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        o.title as opportunity_title,
        u.first_name,
        u.last_name,
        u.email,
        sp.student_id,
        sp.major,
        un.name as university_name,
        un.code as university_code
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN universities un ON sp.university_id = un.id
      WHERE o.site_id = ?
    `;

    const params = [user.id];

    // Status tab filter
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    // University filter
    if (university && university !== 'all') {
      query += ' AND un.name LIKE ?';
      params.push(`%${university}%`);
    }

    // Date range filter
    // Start Date filter
    if (startDate) {
      query += ' AND a.applied_at >= CONCAT(?, " 00:00:00")';
      params.push(startDate);
      countQuery += ' AND a.applied_at >= CONCAT(?, " 00:00:00")';
      countParams.push(startDate);
    }

    // End Date filter
    if (endDate) {
      query += ' AND a.applied_at <= CONCAT(?, " 23:59:59")';
      params.push(endDate);
      countQuery += ' AND a.applied_at <= CONCAT(?, " 23:59:59")';
      countParams.push(endDate);
    }


    // Search filter
    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR o.title LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Validate and apply sorting
    const validSortFields = ['applied_at', 'first_name', 'last_name', 'opportunity_title', 'university_name'];
    const validSortOrders = ['asc', 'desc'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'applied_at';
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // Add pagination
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [applications] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN universities un ON sp.university_id = un.id
      WHERE o.site_id = ?
    `;

    const countParams = [user.id];

    if (status) {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }

    if (university && university !== 'all') {
      countQuery += ' AND un.name LIKE ?';
      countParams.push(`%${university}%`);
    }

    if (startDate) {
      countQuery += ' AND DATE(a.applied_at) >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND DATE(a.applied_at) <= ?';
      countParams.push(endDate);
    }

    if (search) {
      countQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR o.title LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Get application counts by status for all applications (without filters)
    const [counts] = await db.execute(
      `SELECT 
        a.status,
        COUNT(*) AS count
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE o.site_id = ?
      GROUP BY a.status`,
      [user.id]
    );

    // Get unique universities for filter dropdown
    const [universities] = await db.execute(
      `SELECT DISTINCT un.name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN universities un ON sp.university_id = un.id
      WHERE o.site_id = ? AND un.name IS NOT NULL
      ORDER BY un.name`,
      [user.id]
    );

    return new Response(
      JSON.stringify({ 
        applications,
        counts: counts.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        universities: universities.map(u => u.name)
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );


  } catch (error) {
    console.error('Get applications error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}