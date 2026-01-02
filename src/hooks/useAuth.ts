import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
}

// In-memory cache to avoid navbar flicker caused by remounting layouts on route changes.
// (No localStorage/sessionStorage; cache resets on full page reload.)
const authCache: {
  userId: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
} = {
  userId: null,
  profile: null,
  isAdmin: false,
  isApproved: false,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(authCache.profile);
  const [isAdmin, setIsAdmin] = useState(authCache.isAdmin);
  const [isApproved, setIsApproved] = useState(authCache.isApproved);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncCacheForUser = (userId: string) => {
      if (authCache.userId !== userId) {
        authCache.userId = userId;
        authCache.profile = null;
        authCache.isAdmin = false;
        authCache.isApproved = false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        syncCacheForUser(nextSession.user.id);
        // Hydrate state from cache immediately to prevent UI flicker
        setProfile(authCache.profile);
        setIsAdmin(authCache.isAdmin);
        setIsApproved(authCache.isApproved);

        // Fetch user data if missing
        if (!authCache.profile) {
          setTimeout(() => {
            fetchUserData(nextSession.user!.id);
          }, 0);
        } else {
          setIsLoading(false);
        }
      } else {
        authCache.userId = null;
        authCache.profile = null;
        authCache.isAdmin = false;
        authCache.isApproved = false;

        setProfile(null);
        setIsAdmin(false);
        setIsApproved(false);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        syncCacheForUser(initialSession.user.id);
        setProfile(authCache.profile);
        setIsAdmin(authCache.isAdmin);
        setIsApproved(authCache.isApproved);

        if (!authCache.profile) {
          fetchUserData(initialSession.user.id);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        const p = profileData as Profile;
        authCache.userId = userId;
        authCache.profile = p;
        authCache.isApproved = p.is_approved;

        setProfile(p);
        setIsApproved(p.is_approved);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const hasAdminRole = roleData?.some((r) => r.role === 'admin') ?? false;
      authCache.isAdmin = hasAdminRole;
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    authCache.userId = null;
    authCache.profile = null;
    authCache.isAdmin = false;
    authCache.isApproved = false;
  };

  return { user, session, profile, isAdmin, isApproved, isLoading, signOut };
}

