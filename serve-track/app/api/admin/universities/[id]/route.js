import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = getCurrentUser(request);
    const universityId = params.id;

    if (!user || (user.userType !== 'admin' && user.userType !== 'university_admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // If university admin, verify they have access to this university
    if (user.userType === 'university_admin') {
      const [adminDetails] = await db.execute(
        `SELECT university_id FROM university_admins WHERE user_id = ?`,
        [user.id]
      );

      if (adminDetails.length === 0 || adminDetails[0].university_id !== universityId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
    }

    const {
      name,
      code,
      required_hours,
      contact_email
      
    } = await request.json();

    // Validate required fields
    if (!name || !code) {
      return new Response(
        JSON.stringify({ error: 'University name and code are required' }),
        { status: 400 }
      );
    }

    // Check if code already exists (excluding current university)
    const [existing] = await db.execute(
      'SELECT id FROM universities WHERE code = ? AND id != ?',
      [code.toUpperCase(), universityId]
    );

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'University code already exists' }),
        { status: 400 }
      );
    }

    // Update university
    await db.execute(
      `UPDATE universities 
       SET name = ?, code = ?, required_hours = ?, contact_email = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, code.toUpperCase(), required_hours, contact_email, universityId]
    );

    // Get updated university
    const [updatedUniversity] = await db.execute(
      `SELECT * FROM universities WHERE id = ?`,
      [universityId]
    );

    return new Response(
      JSON.stringify({ 
        message: 'University updated successfully',
        university: updatedUniversity[0]
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating university:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}


export async function DELETE(request, { params }) {
    try {
      const user = getCurrentUser(request);
      const universityId = params.id;
  
      // Only system admins can delete universities
      if (!user || user.userType !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
  
      // Check if university has students or admins
      const [studentCheck] = await db.execute(
        'SELECT COUNT(*) as student_count FROM student_profiles WHERE university_id = ?',
        [universityId]
      );
  
      const [adminCheck] = await db.execute(
        'SELECT COUNT(*) as admin_count FROM university_admins WHERE university_id = ?',
        [universityId]
      );
  
      if (studentCheck[0].student_count > 0 || adminCheck[0].admin_count > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot delete university with existing students or admins. Please reassign or remove them first.' 
          }),
          { status: 400 }
        );
      }
  
      // Delete university
      await db.execute(
        'DELETE FROM universities WHERE id = ?',
        [universityId]
      );
  
      return new Response(
        JSON.stringify({ message: 'University deleted successfully' }),
        { status: 200 }
      );
  
    } catch (error) {
      console.error('Error deleting university:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      );
    }
  }

