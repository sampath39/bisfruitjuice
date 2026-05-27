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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('supabase_auth_token', session.access_token);
        await fetchUserProfile(session.user);
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

  // Fetch public.profiles details for authenticated user
  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn('Could not load user profile, syncing profile table...');
        // Let's create user profile if missing
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([
            {
              id: authUser.id,
              phone: authUser.phone || '',
              full_name: authUser.user_metadata?.full_name || 'Customer',
              role: authUser.user_metadata?.role || 'customer'
            }
          ])
          .select()
          .single();
          
        if (newProfile) {
          setUser({ ...authUser, ...newProfile });
        } else {
          setUser(authUser);
        }
      } else {
        setUser({ ...authUser, ...profile });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(authUser);
    }
  };

  // Sign Up method
  const signUp = async (email, password, fullName, phone, role = 'customer') => {
    setLoading(true);
    try {
      if (isMockMode) {
        // Mock Register
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role // default to customer
          }
        }
      });

      if (error) throw error;

      // Sync profile table manually to be immediate
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          phone,
          full_name: fullName,
          role
        });
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign In method
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      if (isMockMode) {
        // Mock Login
        let role = 'customer';
        let fullName = 'Imran Admin';
        // Admin quick toggle login
        if (email.startsWith('admin') || email === 'imran@juice.com') {
          role = 'admin';
          fullName = 'Imran';
        } else {
          fullName = 'Customer User';
        }

        const loggedInUser = {
          id: email.startsWith('admin') ? 'admin_id_mock' : 'cust_id_mock',
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.session) {
        localStorage.setItem('supabase_auth_token', data.session.access_token);
        await fetchUserProfile(data.user);
      }
      return { data, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
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
