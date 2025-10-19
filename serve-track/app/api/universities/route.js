import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET() {
  try {
    const [universities] = await pool.execute(
      'SELECT id, name, code FROM universities'
    );
    return NextResponse.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}