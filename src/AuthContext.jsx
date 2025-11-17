import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  supabase,
  getUserProfile,
  fetchUnreadNotificationCount,
  fetchSubmittedRequestCount,
  fetchMyTaskCount,
  fetchMyReviewCount,
} from "./supabaseClient";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [sidebarBadgeCounts, setSidebarBadgeCounts] = useState({
    submitted: 0,
    myTasks: 0,
    myReviews: 0,
  });

  const loadNotificationCount = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const count = await fetchUnreadNotificationCount(userId);
      setUnreadNotificationCount(count);
    } catch (err) {
      console.error("Gagal memuat jumlah notifikasi:", err);
      setUnreadNotificationCount(0);
    }
  }, []);

  const loadSidebarBadgeCounts = useCallback(async (userId, role) => {
    if (!userId || !role) {
      setSidebarBadgeCounts({ submitted: 0, myTasks: 0, myReviews: 0 });
      return;
    }

    let submitted = 0;
    let myTasks = 0;
    let myReviews = 0;

    try {
      if (["ADMIN", "MANAGEMENT", "PRODUCER"].includes(role)) {
        submitted = await fetchSubmittedRequestCount();
      }

      if (role === "DESIGNER") {
        myTasks = await fetchMyTaskCount(userId);
      }

      if (role === "REQUESTER") {
        myReviews = await fetchMyReviewCount(userId);
      }

      setSidebarBadgeCounts({
        submitted,
        myTasks,
        myReviews,
      });
    } catch (err) {
      console.error("Gagal memuat jumlah badge sidebar:", err);
      setSidebarBadgeCounts({ submitted: 0, myTasks: 0, myReviews: 0 });
    }
  }, []);

  const fetchAuthData = async (currentSession) => {
    if (currentSession) {
      const profile = await getUserProfile(currentSession.user.id);
      setUserProfile(profile);
      loadNotificationCount(currentSession.user.id);

      if (profile) {
        loadSidebarBadgeCounts(currentSession.user.id, profile.role);
      }
    } else {
      setUserProfile(null);
      setUnreadNotificationCount(0);
      loadSidebarBadgeCounts(null, null);
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

  const currentUserId = session?.user?.id;
  const currentUserRole = userProfile?.role;

  useEffect(() => {
    if (!currentUserId || !currentUserRole) return;

    const relevantStatuses = [
      "Submitted",
      "Approved",
      "Revision",
      "For Review",
      "Completed",
      "Canceled",
    ];

    const requestsChannel = supabase
      .channel("sidebar_badge_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          if (
            relevantStatuses.includes(newStatus) ||
            relevantStatuses.includes(oldStatus)
          ) {
            console.log(
              "Realtime request status update received, reloading sidebar badges."
            );
            loadSidebarBadgeCounts(currentUserId, currentUserRole);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
        },
        () => {
          console.log(
            "Realtime request insert received, reloading sidebar badges."
          );
          loadSidebarBadgeCounts(currentUserId, currentUserRole);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, [currentUserId, currentUserRole, loadSidebarBadgeCounts]);

  const value = {
    session,
    setSession,
    loading,
    user: session?.user ?? null,
    userProfile,
    unreadNotificationCount,
    loadNotificationCount,
    sidebarBadgeCounts,
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
