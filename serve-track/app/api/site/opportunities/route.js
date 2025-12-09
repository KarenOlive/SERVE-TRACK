import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';
import normalizeOpportunity from '../../../../lib/normalizeOpportunity';
// GET /api/site/opportunities - List opportunities
export async function GET(request) {
  try {
    const user = getCurrentUser(request);

    if (!user || user.userType !== 'nonprofit') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch opportunities + site location
    const [opportunities] = await db.execute(
      `SELECT 
         o.*,
         sp.location,
         COUNT(a.id) AS application_count,
         COUNT(CASE WHEN a.status = 'pending' THEN 1 END) AS pending_applications
       FROM opportunities o
       LEFT JOIN applications a ON o.id = a.opportunity_id
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       WHERE o.site_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [user.id]
    );

    return new Response(JSON.stringify({ opportunities }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// POST /api/site/opportunities - Create opportunity
export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      volunteersNeeded,
    } = await request.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400 });
    }

    // Insert new opportunity
    const [result] = await db.execute(
      `INSERT INTO opportunities 
         (title, description, site_id, start_date, end_date, volunteers_needed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, user.id, startDate, endDate, volunteersNeeded]
    );

    // Get the newly created opportunity including location
    const [newOpportunity] = await db.execute(
      `SELECT 
         o.*, 
         sp.location
       FROM opportunities o
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       WHERE o.id = ?`,
      [result.insertId]
    );

    const opportunity = normalizeOpportunity(newOpportunity[0]);

    return new Response(
      JSON.stringify({ 
        message: 'Opportunity created successfully',
        opportunity}),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create opportunity error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
