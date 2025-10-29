import { NextResponse } from 'next/server';
import db from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  let connection;
  
  try {
    const { email, password, firstName, lastName, role } = await request.json();

    // Validate role
    const validRoles = ['student', 'nonprofit'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (profile_complete defaults to FALSE)
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName]
      );

      // Get user UUID
      const [newUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      const userId = newUsers[0].id;

      // Get role ID
      const [roleRows] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        [role]
      );

      if (roleRows.length === 0) {
        throw new Error('Role not found');
      }

      const roleId = roleRows[0].id;

      // Assign role
      await connection.execute(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId]
      );

      // Create empty profile based on role
      if (role === 'student') {
        await connection.execute(
          'INSERT INTO student_profiles (user_id) VALUES (?)',
          [userId]
        );
        console.log('Empty nonprofit profile created');

      } else if (role === 'nonprofit') {
        await connection.execute(
          'INSERT INTO sites_profiles (user_id) VALUES (?)',
          [userId]
        );
        console.log('Empty nonprofit profile created');
      }

      await connection.commit();

      // Generate JWT token for subsequent requests
      const token = jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        message: 'Account created successfully',
        token,
        userId,
        role
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Basic registration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}