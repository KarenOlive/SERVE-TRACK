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

    connection = await db.getConnection();

    try {
      // Update nonprofit profile with additional details
      await connection.execute(
        `UPDATE sites_profiles 
         SET organization_description = ?, website = ?, address = ?
         WHERE user_id = ?`,
        [organization_description, website, address, decoded.userId]
      );

      return NextResponse.json({
        message: 'Organization details updated successfully'
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Organization details update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}