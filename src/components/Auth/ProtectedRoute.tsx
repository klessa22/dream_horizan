import { Navigate, Outlet } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// Replace with the real admin email(s) you want to allow
const ADMIN_EMAIL = 'admin@gmail.com';

const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="w-10 h-10 rounded-full border-2 border-stone-700 border-t-accent animate-spin" />
      <span className="text-xs text-stone-500 tracking-widest uppercase font-medium">Verifying session…</span>
    </motion.div>
  </div>
);

export const ProtectedRoute = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (checking) return <LoadingScreen />;
  const isAdmin = user && user.email === ADMIN_EMAIL;
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};
