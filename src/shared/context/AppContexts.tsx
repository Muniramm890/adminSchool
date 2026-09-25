// path: src/shared/context/AppContexts.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { STUDENTS, TEACHERS } from '../mockData';
import { SplashScreen } from '../ui/Brand';



  export const AuthContext = createContext();
  export const DataContext = createContext(); // 🔴 SMART GLOBAL DATA CONTEXT
  export const SessionContext = createContext();
  
  export const useData = () => useContext(DataContext);
  export const useSession = () => useContext(SessionContext);

// Image ko upload se pehle chhota (compress) karne ka function
export const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.7 // 70% Quality — size drops from 5MB to ~40KB
        );
      };
    };
  });
};

export const uploadToCloudinary = async (file) => {
  const CLOUD_NAME = "vosr6w5p"; // Apna Cloud Name
  const UPLOAD_PRESET = "school_erp_files"; // Apna Unsigned Preset

  // Step A: Instant Compress
  const compressedFile = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || "Upload failed");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);

  const logout = React.useCallback(() => {
    localStorage.removeItem("erp_token");
    setUser(null);
  }, []);

  // 🔴 apiRequest ko is logout ka reference de do (reload ki jagah)
  useEffect(() => { authLogoutRef = logout; }, [logout]);

  // 🔴 INACTIVITY AUTO-LOGOUT — 15 min inactive → logout, 1 min pehle warning
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  useEffect(() => {
    if (!user) { setShowIdleWarning(false); return; }

    const TIMEOUT_MS = 15 * 60 * 1000;   // 👈 yahan change karo (5*60*1000 ya 30*60*1000)
    const WARNING_MS = 60 * 1000;        // logout se 1 min pehle warning dikhao

    let idleTimer, warnTimer;

    const resetTimers = () => {
      setShowIdleWarning(false);
      clearTimeout(idleTimer);
      clearTimeout(warnTimer);
      warnTimer = setTimeout(() => setShowIdleWarning(true), TIMEOUT_MS - WARNING_MS);
      idleTimer = setTimeout(() => logout(), TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimers));
    resetTimers();

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warnTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimers));
    };
  }, [user, logout]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("erp_token");
      if (!token || token === "undefined" || token === "null") {
        setLoading(false);
        return;
      }

      // 🔴 WATCHDOG: agar 5 second mein server response nahi aata (hung request,
      // slow network, dead API), to token clean karke login screen pe bhej do —
      // splash kabhi hamesha ke liye atkega nahi.
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timed out")), 5000)
      );

      try {
        // 🔴 Server se actually verify karo ki token valid hai — race against 5s timeout
        const res = await Promise.race([apiRequest("/auth/me"), timeout]);
        const d = res?.data || res;
        setUser({ id: d.id, role: d.role, name: d.full_name || "Principal", schoolId: d.school_id });
      } catch (e) {
        if (e.message === "Auth check timed out") {
          // Server slow/unreachable — token abhi bhi VALID ho sakta hai, isko delete mat karo
          setAuthCheckFailed(true);
        } else {
          // Server ne clearly bola invalid/expired (401) — tabhi token delete karo
          localStorage.removeItem("erp_token");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      // API call
      const response = await apiRequest("/auth/login", "POST", {
        email,
        password,
      });
  
      // 🔥 THE FIX: Agar backend { success: true, data: {...} } bhejta hai, toh use parse karein
      // Warna direct response use karein.
      const payload = response.data ? response.data : response;
  
      if (!payload.token) {
        console.error("No token received:", response);
        throw new Error("Invalid response from server. Token missing.");
      }
  
      // ✅ Perfectly save the token
      localStorage.setItem("erp_token", payload.token);
  
            // ✅ Set User State gracefully (Handles both nested 'user' obj and flat response)
            setUser({
              id: payload.userId || payload.user?.id,
              role: payload.role || payload.user?.role,
              name: payload.name || payload.user?.fullName || "Principal",
              schoolId: payload.schoolId || payload.user?.school?.id,
            });
    } catch (error) {
      throw { response: { data: { error: error.message || "Login failed" } } };
    }
  };
  if (loading) return <SplashScreen />;
  if (authCheckFailed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 14 }}>
        <p style={{ color: "#666", fontSize: 14 }}>Server se connect nahi ho pa raha — internet/server check karo.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Dobara try karo
        </button>
      </div>
    );
  } 
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
      {showIdleWarning && (
        <div
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 9999,
            background: "#1a1a1a", color: "#fff", padding: "14px 18px",
            borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", gap: 14, fontSize: 13.5,
          }}
        >
          <span>Inactivity ki wajah se 1 minute me logout ho jayega.</span>
          <button
            className="btn btn-primary"
            style={{ padding: "5px 12px", fontSize: 12.5 }}
            onClick={() => setShowIdleWarning(false)} // agla activity event already timer reset kar dega
          >
            Main yahi hoon
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// 🔴 SESSION PROVIDER: Ek hi jagah academic-years fetch, poori app me current session share
export const SessionProvider = ({ children }) => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);

  const loadAcademicYears = async () => {
    try {
      const res = await apiRequest("/setup/academic-years");
      const years = res?.data || [];
      setAcademicYears(years);
      setAcademicYearId((prev) => {
        if (prev && years.some((y) => y.id === prev)) return prev; // user ka manual selection preserve karo
        const current = years.find((y) => y.is_current) || years[0];
        return current?.id || "";
      });
    } catch (e) {
      console.error("Failed to load academic years:", e.message);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAcademicYears();
  }, [user]);

  const currentYear = academicYears.find((y) => y.id === academicYearId) || null;

  return (
    <SessionContext.Provider
      value={{
        academicYears,
        academicYearId,
        setAcademicYearId,
        currentYear,
        sessionLoading,
        reloadAcademicYears: loadAcademicYears,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// Gatekeeper Component: Check karta hai user logged in hai ya nahi
// 🔴 DATA PROVIDER: Fetch once from Azure, use everywhere
export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [appData, setAppData] = useState({
    students: STUDENTS, // Fallback to global mock data so nothing breaks
    teachers: TEACHERS,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      try {
        // Fetch real data from Azure backend
        const [realStudents, realTeachers] = await Promise.all([
          apiRequest("/students"),
          apiRequest("/teachers"),
        ]);

        setAppData({
          students: realStudents.length > 0 ? realStudents : STUDENTS,
          teachers: realTeachers.length > 0 ? realTeachers : TEACHERS,
          loading: false,
        });
      } catch (err) {
        console.warn(
          "Using fallback Mock Data. API failed or not ready yet:",
          err.message
        );
        setAppData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAllData();
  }, [user]);

  return (
    <DataContext.Provider value={appData}>{children}</DataContext.Provider>
  );
};
