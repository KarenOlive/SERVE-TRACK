import { NextResponse } from 'next/server';
import db from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let connection;
  
  try {
    console.log(' Attempting to connect to database...');
    connection = await db.getConnection();
    console.log(' Database connection successful!');

    const { 
      email, password, firstName, lastName, 
      organization_name, organization_description, website, 
      contact_phone, address, location 
    } = await request.json();

    console.log(' Nonprofit registration attempt for:', { email, organization_name });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(' Password hashed successfully');

    await connection.beginTransaction();
    console.log(' Transaction started');

    try {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Insert into users table
      console.log('Inserting user into database...');
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName]
      );

      console.log(' User insertion result (UUID table):', userResult);
      
      // Fetch the user by email to get the UUID
      console.log(' Fetching user by email to get UUID...');
      const [newUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (newUsers.length === 0) {
        throw new Error('User insertion failed - cannot retrieve user after insertion');
      }
      
      const userId = newUsers[0].id;
      console.log(' User created with UUID:', userId);

      // Get nonprofit role ID
      console.log(' Looking for nonprofit role...');
      const [roleRows] = await connection.execute(
        'SELECT id, name FROM roles WHERE name = ?',
        ['nonprofit']
      );

      console.log(' Role query results:', roleRows);

      if (roleRows.length === 0) {
        throw new Error('Nonprofit role not found in database');
      }

      const roleId = roleRows[0].id;
      console.log('Role found: nonprofit ID:', roleId);

      // Assign role to user
      console.log(' Assigning role to user...');
      const [roleAssignmentResult] = await connection.execute(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId]
      );
      
      console.log('Role assignment result:', roleAssignmentResult);

      // Create nonprofit profile with all the provided data
      console.log(' Creating nonprofit profile...');
      
      await connection.execute(
        `INSERT INTO sites_profiles 
         (user_id, organization_name, organization_description, website, contact_phone, address, location) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, organization_name, organization_description, website, contact_phone, address, location]
      );
      console.log(' Nonprofit profile created');

      await connection.commit();
      console.log(' Transaction committed successfully');

      return NextResponse.json(
        { message: 'Organization registered successfully', userId: userId },
        { status: 201 }
      );

    } catch (error) {
      await connection.rollback();
      console.error(' Transaction rolled back due to error:', error.message);
      throw error;
    }

  } catch (error) {
    console.error(' Nonprofit registration error:', error.message);
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      console.log(' Database connection released');
    }
  }
}