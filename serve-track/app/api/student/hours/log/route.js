import db from '../../../../../lib/database';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(request) {
    try {
      const user = getCurrentUser(request);
      if (!user || user.userType !== 'student') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
  
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit')) || 10;
  
      const [hourLogs] = await db.execute(
        `SELECT 
          hl.id,
          hl.date_worked,
          hl.hours,
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
        ORDER BY hl.created_at DESC
        LIMIT ${limit}`, // Use template literal for LIMIT`,
        [user.id]
      );
  
      // Get total hours by status
      const [totals] = await db.execute(
        `SELECT 
          status,
          SUM(hours) as total_hours,
          COUNT(*) as count
        FROM hour_logs 
        WHERE student_id = ?
        GROUP BY status`,
        [user.id]
      );
  
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
      console.error('Error fetching student hour logs:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.userType !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { opportunity_id, date_worked, hours, time_in, time_out, description, input_method } = await request.json();

    // Validate required fields
    if (!opportunity_id || !date_worked || !description) {
      return new Response(
        JSON.stringify({ error: 'Opportunity, date, and description are required' }), 
        { status: 400 }
      );
    }

    let finalTimeIn = time_in;
    let finalTimeOut = time_out;
    let finalHours = hours;

    // Validate based on input method
    if (input_method === 'time') {
      // Time in/out method
      if (!time_in || !time_out) {
        return new Response(
          JSON.stringify({ error: 'Both time in and time out are required' }), 
          { status: 400 }
        );
      }

      // Calculate hours from time_in and time_out
      const [startHours, startMinutes] = time_in.split(':').map(Number);
      const [endHours, endMinutes] = time_out.split(':').map(Number);
      
      let startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;
      
      // Handle overnight shifts (time_out is next day)
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Add 24 hours
      }
      
      const totalMinutes = endTotalMinutes - startTotalMinutes;
      finalHours = (totalMinutes / 60).toFixed(2);
      
    } else if (input_method === 'manual') {
      // Manual hours method
      if (!hours) {
        return new Response(
          JSON.stringify({ error: 'Hours are required for manual entry' }), 
          { status: 400 }
        );
      }
      
      // For manual entry, set default times (9 AM to calculated end time)
      finalTimeIn = '09:00';
      const startTotalMinutes = 9 * 60; // 9:00 AM in minutes
      const endTotalMinutes = startTotalMinutes + (hours * 60);
      const endHours = Math.floor(endTotalMinutes / 60) % 24;
      const endMinutes = Math.floor(endTotalMinutes % 60);
      finalTimeOut = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    }

    // Validate hours (must be between 0 and 24)
    if (finalHours <= 0 || finalHours > 24) {
      return new Response(
        JSON.stringify({ error: 'Hours must be between 0.01 and 24' }), 
        { status: 400 }
      );
    }

    // Check if student has approved application for this opportunity
    const [applications] = await db.execute(
      `SELECT id FROM applications 
       WHERE student_id = ? AND opportunity_id = ? AND status = 'approved'`,
      [user.id, opportunity_id]
    );

    if (!applications || applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'You are not approved for this opportunity' }), 
        { status: 403 }
      );
    }

   // Check if date is not in the future
   const today = new Date().toISOString().split('T')[0];
   if (date_worked > today) {
     return new Response(
       JSON.stringify({ error: 'Cannot log hours for future dates' }), 
       { status: 400 }
     );
   }

   // Insert hour log
   const [result] = await db.execute(
     `INSERT INTO hour_logs 
       (student_id, opportunity_id, date_worked, hours, time_in, time_out, description, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
     [user.id, opportunity_id, date_worked, finalHours, finalTimeIn, finalTimeOut, description || null]
   );


    // Get the newly created hour log with opportunity details
    const [newLog] = await db.execute(
      `SELECT 
        hl.id,
        hl.date_worked,
        hl.hours,
        hl.description,
        hl.status,
        hl.created_at,
        o.title as opportunity_title,
        sp.organization_name
      FROM hour_logs hl
      INNER JOIN opportunities o ON hl.opportunity_id = o.id
      INNER JOIN sites_profiles sp ON o.site_id = sp.user_id
      WHERE hl.id = ?`,
      [result.insertId]
    );

    return new Response(
      JSON.stringify({ 
        message: 'Hours logged successfully',
        hourLog: newLog[0]
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error logging hours:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

