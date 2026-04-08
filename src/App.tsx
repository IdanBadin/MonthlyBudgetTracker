import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import { AuthForm } from './components/AuthForm';
import { supabase } from './lib/supabase';
import { Profile } from './types/database';
import { Toaster } from 'react-hot-toast';
import { scheduleBackup } from './lib/backup';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
      if (data.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (data.language === 'he') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (session?.user?.id && userIdRef.current !== session.user.id) {
      userIdRef.current = session.user.id;
      scheduleBackup(session.user.id);
      const backupInterval = setInterval(() => {
        if (userIdRef.current) {
          scheduleBackup(userIdRef.current);
        }
      }, 6 * 60 * 60 * 1000);
      return () => {
        clearInterval(backupInterval);
      };
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (profile?.theme_colors) {
      document.documentElement.style.setProperty('--color-primary', profile.theme_colors.primary);
      document.documentElement.style.setProperty('--color-secondary', profile.theme_colors.secondary);
    }
  }, [profile?.theme_colors?.primary, profile?.theme_colors?.secondary]);

  const handleProfileUpdate = useCallback(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    }
  }, [session?.user?.id, fetchProfile]);

  return (
    <Router>
      <Toaster position="top-right" />
      {!session ? (
        <AuthForm />
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} onProfileUpdate={handleProfileUpdate} />} />
          <Route path="/analysis" element={<MonthlyAnalysis profile={profile} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
