// path: src/modules/core/MainLayout.tsx

import { useState, useRef, useEffect } from 'react';
import { LoginPage } from '../auth/LoginPage';
import { SchoolERP } from './SchoolERP';
import { useAuth } from '../../shared/context/AppContexts';
import { SplashScreen } from '../../shared/ui/Brand';



// Gatekeeper Component: Check karta hai user logged in hai ya nahi
export const MainLayout = () => {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const hadUserRef = useRef(false);

  useEffect(() => {
    // Sirf login ke moment pe (no-user -> user transition) splash dikhao,
    // page refresh ka case AuthProvider ke apne loading state se already handle hai.
    if (user && !hadUserRef.current) {
      setShowSplash(true);
      hadUserRef.current = true;
      const t = setTimeout(() => setShowSplash(false), 2200);
      return () => clearTimeout(t);
    }
    if (!user) hadUserRef.current = false;
  }, [user]);

  if (!user) return <LoginPage />;
  if (showSplash) return <SplashScreen />;
  return <SchoolERP />;
};
