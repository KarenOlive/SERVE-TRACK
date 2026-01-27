import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationFilter = searchParams.get('location');
    const statusFilter = searchParams.get('status');
    const organizationFilter = searchParams.get('organization');
    const searchQuery = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'start_date';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Base query to get available opportunities
    let query = `
      SELECT 
        o.*,
        sp.organization_name,
        sp.location,
        sp.contact_phone,
        sp.website,
        COUNT(a.id) AS application_count,
        EXISTS(
          SELECT 1 FROM applications a2 
          WHERE a2.opportunity_id = o.id AND a2.student_id = ?
        ) AS has_applied
      FROM opportunities o
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      LEFT JOIN applications a ON o.id = a.opportunity_id
      WHERE o.status = 'active'
    `;

    const queryParams = [user.id];

    // Apply filters
    if (locationFilter) {
      query += ` AND sp.location LIKE ?`;
      queryParams.push(`%${locationFilter}%`);
    }

    if (organizationFilter) {
        query += ` AND sp.organization_name LIKE ?`;
        queryParams.push(`%${organizationFilter}%`);
    }

    if (searchQuery) {
        query += ` AND (o.title LIKE ? OR o.description LIKE ? OR sp.organization_name LIKE ?)`;
        queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (statusFilter === 'upcoming') {
      query += ` AND o.start_date > CURDATE()`;
    } else if (statusFilter === 'ongoing') {
      query += ` AND o.start_date <= CURDATE() AND (o.end_date IS NULL OR o.end_date >= CURDATE())`;
    } else if (statusFilter === 'past') {
      query += ` AND o.end_date < CURDATE()`;
    }

    // Group by and sort
    query += ` GROUP BY o.id`;

    // Validate and apply sorting
    const validSortFields = ['start_date', 'created_at', 'estimated_hours', 'volunteers_needed'];
    const validSortOrders = ['asc', 'desc'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'start_date';
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    const [opportunities] = await db.execute(query, queryParams);

    // Get unique locations for filter dropdown
    const [filterData] = await db.execute(`
        SELECT DISTINCT 
        sp.location,
        sp.organization_name
    FROM opportunities o
    INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
    WHERE o.status = 'active' 
        AND sp.location IS NOT NULL 
        AND sp.organization_name IS NOT NULL
    ORDER BY sp.location, sp.organization_name
    `);

    const locations = [...new Set(filterData.map(row => row.location).filter(Boolean))];
    const organizations = [...new Set(filterData.map(row => row.organization_name).filter(Boolean))];

    return new Response(
      JSON.stringify({ 
        opportunities, 
        locations,
        organizations 
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching student opportunities:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}