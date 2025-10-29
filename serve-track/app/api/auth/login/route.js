import db from '../../../../lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email and password are required' 
        }),
        { status: 400 }
      );
    }

    // STEP 1: Simple check if user exists by email 
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password' 
        }),
        { status: 401 }
      );
    }

    const user = users[0];

    // STEP 2: Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password' 
        }),
        { status: 401 }
      );
    }

    // STEP 3: Get user role from user_roles table (much simpler)
    const [userRoles] = await db.execute(
      `SELECT r.name as role_name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    if (userRoles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User role not found' 
        }),
        { status: 401 }
      );
    }

    const userType = userRoles[0].role_name;

    // STEP 4: Get basic profile data (only what we need for login)
    let profileData = null;

    if (userType === 'student') {
      const [studentProfiles] = await db.execute(
        'SELECT student_id, university_id FROM student_profiles WHERE user_id = ?',
        [user.id]
      );
      profileData = studentProfiles[0];
    } else if (userType === 'nonprofit') {
      const [siteProfiles] = await db.execute(
        'SELECT organization_name, location FROM sites_profiles WHERE user_id = ?',
        [user.id]
      );
      profileData = siteProfiles[0];
    }
    // Add admin profile check if needed

    // STEP 5: Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        userType: userType,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          userType: userType,
          firstName: user.first_name,
          lastName: user.last_name,
          profile: profileData
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { status: 500 }
    );
  }
}