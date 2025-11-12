import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, getUserProfile } from "./supabaseClient"; // Import fungsi getUserProfile

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // State baru untuk data public.users
  const [loading, setLoading] = useState(true);

  const fetchAuthData = async (currentSession) => {
    if (currentSession) {
      const profile = await getUserProfile(currentSession.user.id);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      fetchAuthData(initialSession);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        fetchAuthData(newSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    setSession,
    loading,
    user: session?.user ?? null,
    userProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-lg font-semibold text-purple-600">Memuat Sesi...</div>
  </div>
);
