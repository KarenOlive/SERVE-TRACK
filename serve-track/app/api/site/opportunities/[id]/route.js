import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';
import normalizeOpportunity from '../../../../../lib/normalizeOpportunity';
// GET /api/site/opportunities/[id] - Get specific opportunity
export async function GET(request, context) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const [opportunities] = await db.execute(
      `SELECT 
         o.*,
         sp.location,
         COUNT(a.id) AS application_count,
         COUNT(CASE WHEN a.status = 'pending' THEN 1 END) AS pending_applications
       FROM opportunities o
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       LEFT JOIN applications a ON o.id = a.opportunity_id
       WHERE o.id = ? AND o.site_id = ?
       GROUP BY o.id
       LIMIT 1`,
      [id, user.id]
    );

    if (opportunities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Opportunity not found' }),
        { status: 404 }
      );
    }


    // Convert snake_case → camelCase for frontend
    const opportunity = normalizeOpportunity(opportunities[0]);

    
    return new Response(
      JSON.stringify({ opportunity }),
      { 
        message: 'Opportunity found',
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    

  } catch (error) {
    console.error('Get opportunity error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// PUT /api/site/opportunities/[id] - Update opportunity
export async function PUT(request, context) {
  try {
    const user = getCurrentUser(request);

    if (!user || user.userType !== 'nonprofit') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await context.params;
    const updates = await request.json();

    //  Map camelCase → snake_case automatically
    const fieldMap = {
      title: 'title',
      description: 'description',
      startDate: 'start_date',
      endDate: 'end_date',
      volunteersNeeded: 'volunteers_needed',
      status: 'status'
    };

    const normalizedUpdates = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (fieldMap[key]) {
        normalizedUpdates[fieldMap[key]] = value;
      }
    });

    //  Verify that there are fields to update
    if (Object.keys(normalizedUpdates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 });
    }

    //  Ensure opportunity belongs to the current user
    const [check] = await db.execute(
      'SELECT id FROM opportunities WHERE id = ? AND site_id = ?',
      [id, user.id]
    );

    if (check.length === 0) {
      return new Response(JSON.stringify({ error: 'Opportunity not found' }), { status: 404 });
    }

    //  Build the update query dynamically
    const setClauses = Object.keys(normalizedUpdates).map((field) => `${field} = ?`);
    const values = [...Object.values(normalizedUpdates), id];


    await db.execute(`UPDATE opportunities SET ${setClauses.join(', ')} WHERE id = ?`, values);

    //  Optionally return the updated record with location
    const [updated] = await db.execute(
      `SELECT 
         o.*, 
         sp.location,
         COUNT(a.id) AS application_count,
         COUNT(CASE WHEN a.status = 'pending' THEN 1 END) AS pending_applications
       FROM opportunities o
       LEFT JOIN sites_profiles sp ON o.site_id = sp.user_id
       LEFT JOIN applications a ON o.id = a.opportunity_id
       WHERE o.id = ?
       GROUP BY o.id
       LIMIT 1`,
      [id]
    );

    // Normalize opportunity record
    const opportunity = normalizeOpportunity(updated[0]);


      return new Response(
        JSON.stringify({
          message: 'Opportunity updated successfully',
          opportunity,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );


  } catch (error) {
    console.error('Update opportunity error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}


// DELETE /api/nonprofit/opportunities/[id] - Delete opportunity
export async function DELETE(request, context) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'nonprofit') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify the opportunity belongs to this nonprofit
    const [opportunities] = await db.execute(
      'SELECT id FROM opportunities WHERE id = ? AND site_id = ?',
      [id, user.id]
    );

    if (opportunities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Opportunity not found' }),
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM opportunities WHERE id = ?', [id]);

    return new Response(
      JSON.stringify({ message: 'Opportunity deleted successfully' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete opportunity error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}