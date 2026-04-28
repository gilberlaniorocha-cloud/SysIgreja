import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  igrejaId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  igrejaId: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [igrejaId, setIgrejaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // If the refresh token is invalid or not found, sign out to clear local storage
          if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('refresh_token_not_found')) {
            console.warn('Stale session detected, signing out...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIgrejaId(null);
            setLoading(false);
            return;
          }
          throw error;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchIgrejaId(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchIgrejaId(session.user.id);
      } else {
        setIgrejaId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchIgrejaId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('igreja_id')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setIgrejaId(data ? (data as any).igreja_id : null);
    } catch (error) {
      console.error('Error fetching igreja_id:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, igrejaId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
