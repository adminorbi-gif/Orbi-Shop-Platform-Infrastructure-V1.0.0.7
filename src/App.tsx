import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ToastProvider } from './components/Toast';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { OrbiBootSplash, PwaExperience } from './components/PwaExperience';

const ClientApp = lazyWithRetry(() => import('./pages/ClientApp'));
const AdminApp = lazyWithRetry(() => import('./pages/AdminApp'));

function ProtectedRoute({ children, fallbackPath }: { children: React.ReactNode, fallbackPath: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) {
    return <OrbiBootSplash />;
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastProvider>
      <div className="relative min-h-screen">
        <PwaExperience />
        <Suspense fallback={<OrbiBootSplash />}>
          <Routes>
            {/* Client Routes */}
            <Route path="/" element={<ClientApp />} />
            <Route path="/product/:slug" element={<ClientApp />} />
            <Route path="/checkout" element={<ClientApp />} />
            <Route path="/track/:orderId" element={<ClientApp />} />
            
            {/* Seller Routes (Currently sharing AdminApp components but separated by route conceptually) */}
            <Route path="/seller/login" element={<AdminApp />} />
            <Route path="/seller/signup" element={<AdminApp />} />
            <Route 
              path="/seller/dashboard" 
              element={
                <ProtectedRoute fallbackPath="/seller/login">
                  <AdminApp />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminApp />} />
            
            {/* Fallback for older query-param style links (optional, could redirect) */}
            <Route path="*" element={<ClientApp />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}
