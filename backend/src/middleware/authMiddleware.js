import { createClerkClient } from '@clerk/backend';
import { isMockMode } from '../config/db.js';

// Initialize the Clerk backend client using the secret key from environment variables
const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

/**
 * Middleware to verify Clerk Auth token or mock token and attach user to request
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Handle Mock Authentication token bypass (used in tests and local development)
    if (isMockMode || token.startsWith('mock_token_jwt_')) {
      const role = token.includes('admin') ? 'admin' : 'customer';
      req.user = {
        id: role === 'admin' ? 'admin_id_mock' : 'cust_id_mock',
        email: role === 'admin' ? 'imran@juice.com' : 'customer@demo.com',
        phone: '+91 79896 46180',
        fullName: role === 'admin' ? 'Imran' : 'Customer Demo',
        role
      };
      return next();
    }

    try {
      // Real Clerk Token verification
      const verified = await clerkClient.verifyToken(token);
      
      // Fetch full user details from Clerk to get email, phone, metadata role, etc.
      const user = await clerkClient.users.getUser(verified.sub);
      
      const email = user.emailAddresses[0]?.emailAddress || '';
      const phone = user.phoneNumbers[0]?.phoneNumber || '';
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
      const role = user.unsafeMetadata?.role || 'customer';

      // Attach user data to the request object
      req.user = {
        id: user.id,
        email,
        phone,
        fullName,
        role
      };

      next();
    } catch (verifyError) {
      console.warn('[Auth Middleware] Clerk verification failed:', verifyError.message);
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error in auth verification' });
  }
};

/**
 * Middleware to enforce admin-only routes
 */
export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: Admin credentials required' });
    }
  });
};

/**
 * Optional auth middleware — attaches user if token is valid, allows guests through
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token — treat as guest
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Handle Mock Authentication token bypass
    if (isMockMode || token.startsWith('mock_token_jwt_')) {
      const role = token.includes('admin') ? 'admin' : 'customer';
      req.user = {
        id: role === 'admin' ? 'admin_id_mock' : 'cust_id_mock',
        email: role === 'admin' ? 'imran@juice.com' : 'customer@demo.com',
        phone: '+91 79896 46180',
        fullName: role === 'admin' ? 'Imran' : 'Customer Demo',
        role
      };
      return next();
    }

    try {
      // Verify token
      const verified = await clerkClient.verifyToken(token);
      
      // Fetch full user details from Clerk
      const user = await clerkClient.users.getUser(verified.sub);
      
      const email = user.emailAddresses[0]?.emailAddress || '';
      const phone = user.phoneNumbers[0]?.phoneNumber || '';
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
      const role = user.unsafeMetadata?.role || 'customer';

      req.user = {
        id: user.id,
        email,
        phone,
        fullName,
        role
      };
    } catch (verifyError) {
      // Token invalid or expired, treat as guest (don't 401)
      req.user = null;
    }

    next();
  } catch (err) {
    // On any error, let request through as guest
    req.user = null;
    next();
  }
};
