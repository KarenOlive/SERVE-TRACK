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
    
    const { organization_description, website, address } = await request.json();

    if (!organization_description || !website || !address) {
      return NextResponse.json(
        { error: 'Organization description, website, and address are required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update nonprofit profile with additional details
      await connection.execute(
        `UPDATE sites_profiles 
         SET organization_description = ?, website = ?, address = ?
         WHERE user_id = ?`,
        [organization_description, website, address, decoded.userId]
      );

      // Mark profile as complete in users table
      await connection.execute(
        `UPDATE users SET profile_complete = 1, updated_at = NOW() WHERE id = ?`,
        [decoded.userId]
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Organization full profile updated successfully and marked as complete'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Organization full profile update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}