import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();

    return NextResponse.json({ message: 'Database connected successfully!' });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}