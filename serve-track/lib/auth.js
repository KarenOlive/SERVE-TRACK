import jwt from 'jsonwebtoken';

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
  
  return verifyToken(token);
}

// NEW FUNCTION: Async version for API routes that need to await
export async function getCurrentUserAsync(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return verifyToken(token);
}