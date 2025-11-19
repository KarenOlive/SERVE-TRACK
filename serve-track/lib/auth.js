import jwt from 'jsonwebtoken';
import db from './database';

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn('[auth] Invalid token:', error.message);
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function isAuthenticated(request) {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  
  const decoded = verifyToken(token);
  return !!decoded;
}

export function getCurrentUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;

  return {
    id: decoded.userId,
    email: decoded.email,
    userType: decoded.userType, // This can now be: student, nonprofit, admin, or university_admin
  };
}

// NEW FUNCTION: Get user roles from database (for RBAC)
export async function getUserRoles(userId) {
  try {
    const [roles] = await db.execute(
      `SELECT r.name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [userId]
    );
    
    return roles.map(role => role.name);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

// NEW FUNCTION: Check if user has specific role
export async function userHasRole(userId, roleName) {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

// NEW FUNCTION: Check if user is any type of admin
export async function isAnyAdmin(userId) {
  const roles = await getUserRoles(userId);
  return roles.includes('admin') || roles.includes('university_admin');
}

// NEW FUNCTION: Get user's university admin details if applicable
export async function getUniversityAdminDetails(userId) {
  try {
    const [details] = await db.execute(
      `SELECT ua.university_id, ua.can_manage_nonprofits, ua.can_manage_students, ua.can_manage_admins,
              univ.name as university_name
       FROM university_admins ua
       JOIN universities univ ON ua.university_id = univ.id
       WHERE ua.user_id = ?`,
      [userId]
    );
    
    return details.length > 0 ? details[0] : null;
  } catch (error) {
    console.error('Error fetching university admin details:', error);
    return null;
  }
}

// NEW FUNCTION: Async version for API routes that need to await
export async function getCurrentUserAsync(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return verifyToken(token);
}