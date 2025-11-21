import db from '../../../../../../lib/database';
import { getCurrentUser } from '../../../../../../lib/auth';

export async function POST(request, { params }) {
  try {
     // Await the params to get the ID
     const { id } = await params;

    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const opportunityId = id;

    // Check if opportunity exists and is active
    const [opportunity] = await db.execute(
      `SELECT * FROM opportunities WHERE id = ? AND status = 'active'`,
      [opportunityId]
    );

    if (!opportunity || opportunity.length === 0) {
      return new Response(JSON.stringify({ error: 'Opportunity not found or not available' }), { status: 404 });
    }

    // Check if student has already applied
    const [existingApplication] = await db.execute(
      `SELECT id FROM applications WHERE student_id = ? AND opportunity_id = ?`,
      [user.id, opportunityId]
    );

    if (existingApplication && existingApplication.length > 0) {
      return new Response(JSON.stringify({ error: 'You have already applied to this opportunity' }), { status: 409 });
    }

    // Create application
    const [result] = await db.execute(
      `INSERT INTO applications (student_id, opportunity_id, status, applied_at) 
       VALUES (?, ?, 'pending', NOW())`,
      [user.id, opportunityId]
    );

    return new Response(
      JSON.stringify({ 
        message: 'Application submitted successfully',
        applicationId: result.insertId 
      }), 
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error applying to opportunity:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}