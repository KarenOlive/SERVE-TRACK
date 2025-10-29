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
    
    const { organization_name, location, contact_phone } = await request.json();

    // Validate required fields
    if (!organization_name || !location || !contact_phone) {
      return NextResponse.json(
        { error: 'Organization name, location and phone contact are required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update nonprofit profile with basic information
      await connection.execute(
        `UPDATE sites_profiles 
         SET organization_name = ?, location = ?, contact_phone = ?
         WHERE user_id = ?`,
        [organization_name, location, contact_phone, decoded.userId]
      );

      // Mark user profile as complete (they have the minimum required info)
      await connection.execute(
        'UPDATE users SET profile_complete = TRUE WHERE id = ?',
        [decoded.userId]
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Organization profile updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Nonprofit profile completion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}