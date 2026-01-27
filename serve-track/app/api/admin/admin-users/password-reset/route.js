import db from '@/lib/database';
import { getCurrentUser, userHasRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const currentUser = getCurrentUser(request);
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'User ID and new password are required' }),
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400 }
      );
    }

    // Check if current user is authorized to reset this password
    const isSystemAdmin = await userHasRole(currentUser.id, 'admin');
    const isUniversityAdmin = await userHasRole(currentUser.id, 'university_admin');
    
    // System admins can reset any admin's password
    // University admins can only reset their own password
    if (isSystemAdmin) {
      // System admin can reset any admin password
      const [targetUserRoles] = await db.execute(
        `SELECT r.name 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = ? AND r.name IN ('admin', 'university_admin')`,
        [userId]
      );

      if (targetUserRoles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Target user is not an admin' }),
          { status: 400 }
        );
      }
    } else if (isUniversityAdmin && currentUser.id === userId) {
      // University admin can reset their own password - this is allowed
    } else {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to reset this password' }),
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    return new Response(
      JSON.stringify({ message: 'Password reset successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}