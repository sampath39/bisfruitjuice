import { supabase, isMockMode } from '../config/db.js';

/**
 * Middleware to verify Supabase Auth token or mock token and attach user to request
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
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

    // Real Supabase Auth verification
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // Fetch user's profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    // Attach user and profile data to the request object
    req.user = {
      id: user.id,
      email: user.email,
      phone: profile?.phone || user.phone,
      fullName: profile?.full_name || user.user_metadata?.full_name || 'Customer',
      role: profile?.role || 'customer'
    };

    next();
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
