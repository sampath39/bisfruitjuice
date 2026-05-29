import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockMode } from '../utils/supabase.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth Session
  useEffect(() => {
    if (isMockMode) {
      // Mock Auth Mode Initialization
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        localStorage.setItem('supabase_auth_token', 'mock_token_jwt_' + parsed.role);
      }
      setLoading(false);
      return;
    }

    // Real Supabase Auth Mode Initialization
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('supabase_auth_token', session.access_token);
          await fetchUserProfile(session.user);
        } else {
          localStorage.removeItem('supabase_auth_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Subscribe to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('supabase_auth_token', session.access_token);
        // Set user immediately so UI unblocks, then sync profile in background
        setUser(session.user);
        fetchUserProfile(session.user).catch(() => {});
      } else {
        localStorage.removeItem('supabase_auth_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch public.profiles details for authenticated user (with 5s timeout)
  const fetchUserProfile = async (authUser) => {
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        // Profile missing — create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert([
            {
              id: authUser.id,
              phone: authUser.phone || authUser.user_metadata?.phone || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Customer',
              role: authUser.user_metadata?.role || 'customer'
            }
          ])
          .select()
          .single();

        setUser({ ...authUser, ...(newProfile || {}), full_name: newProfile?.full_name || authUser.user_metadata?.full_name || 'Customer' });
      } else {
        setUser({ ...authUser, ...profile });
      }
    } catch (err) {
      console.warn('fetchUserProfile error (using basic auth user):', err.message);
      setUser(authUser); // Fallback: use raw Supabase auth user
    }
  };

  // Helper to humanize Supabase error messages
  const humanizeSupabaseError = (err) => {
    const msg = err?.message || '';
    if (msg.includes('Email not confirmed')) {
      return 'Please verify your email before logging in. Check your inbox for the confirmation link.';
    }
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('Unable to validate email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (msg.includes('Network') || msg.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return msg || 'Authentication failed. Please try again.';
  };

  // Sign Up method — does NOT touch global loading state
  const signUp = async (email, password, fullName, phone, role = 'customer') => {
    try {
      if (isMockMode) {
        const mockId = `usr_mock_${Math.random().toString(36).substring(2, 11)}`;
        const newUser = {
          id: mockId,
          email,
          phone,
          full_name: fullName,
          role: role || 'customer',
          created_at: new Date().toISOString()
        };
        localStorage.setItem('mock_user', JSON.stringify(newUser));
        localStorage.setItem('supabase_auth_token', 'mock_token_jwt_' + newUser.role);
        setUser(newUser);
        return { data: { user: newUser }, error: null };
      }

      // Real Supabase Sign Up
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone, role },
          emailRedirectTo: `${siteUrl}/orders`
        }
      });

      if (error) {
        return { data: null, error: { message: humanizeSupabaseError(error) } };
      }

      // Sync profile table (don't block sign-up if this fails)
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({ id: data.user.id, phone, full_name: fullName, role });
        } catch (e) {
          console.warn('Profile upsert failed (table may not exist yet):', e);
        }
      }

      // Supabase requires email confirmation (default) — user must confirm before signing in
      if (data.user && !data.session) {
        return { 
          data, 
          error: null, 
          requiresEmailConfirmation: true,
          message: '✅ Account created! Check your email and click the confirmation link, then sign in.'
        };
      }

      // Email confirmation disabled in Supabase — auto-signed-in
      if (data.session) {
        localStorage.setItem('supabase_auth_token', data.session.access_token);
        try {
          await fetchUserProfile(data.user);
        } catch (e) {
          setUser(data.user);
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: { message: humanizeSupabaseError(err) } };
    }
  };

  // Sign In method — does NOT touch global loading state
  const signIn = async (email, password) => {
    try {
      if (isMockMode) {
        let role = 'customer';
        let fullName = 'Customer User';
        if (email.startsWith('admin') || email === 'imran@juice.com') {
          role = 'admin';
          fullName = 'Imran';
        }
        const loggedInUser = {
          id: role === 'admin' ? 'admin_id_mock' : 'cust_id_mock',
          email,
          phone: '+91 99999 99999',
          full_name: fullName,
          role,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('mock_user', JSON.stringify(loggedInUser));
        localStorage.setItem('supabase_auth_token', 'mock_token_jwt_' + loggedInUser.role);
        setUser(loggedInUser);
        return { data: { user: loggedInUser }, error: null };
      }

      // Real Supabase Sign In
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { data: null, error: { message: humanizeSupabaseError(error) } };
      }

      // Auth succeeded — store token immediately and return.
      // Fire fetchUserProfile in background (don't await) so sign-in
      // never hangs if the profiles table is slow or unreachable.
      if (data.session) {
        localStorage.setItem('supabase_auth_token', data.session.access_token);
        setUser(data.user); // Set basic user immediately so UI unblocks
        fetchUserProfile(data.user).catch(() => {}); // Background sync
      }

      return { data, error: null }; // Always return success if Supabase auth succeeded
    } catch (err) {
      console.error('Sign in error:', err);
      return { data: null, error: { message: humanizeSupabaseError(err) } };
    }
  };

  // Sign Out method
  const signOut = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        localStorage.removeItem('mock_user');
        localStorage.removeItem('supabase_auth_token');
        setUser(null);
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('supabase_auth_token');
      setUser(null);
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
