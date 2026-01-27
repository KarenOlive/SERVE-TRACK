import { NextResponse } from 'next/server';
import db from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  let connection;
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { studentId, universityId, major } = await request.json();

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update student profile
      await connection.execute(
        `UPDATE student_profiles 
         SET student_id = ?, university_id = ?, major = ?
         WHERE user_id = ?`,
        [studentId, universityId, major, decoded.userId]
      );

      // Mark user profile as complete
      await connection.execute(
        'UPDATE users SET profile_complete = TRUE WHERE id = ?',
        [decoded.userId]
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Profile completed successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}