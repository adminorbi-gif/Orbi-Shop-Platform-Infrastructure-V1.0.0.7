import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

const ClientApp = lazy(() => import('./pages/ClientApp'));
const AdminApp = lazy(() => import('./pages/AdminApp'));

function ProtectedRoute({ children, fallbackPath }: { children: React.ReactNode, fallbackPath: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
            alt="Orbi Shop Logo" 
            className="w-24 h-24 object-contain animate-pulse grayscale rounded-full" 
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
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
    <div className="relative min-h-screen">
      <Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-sans">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
              alt="Orbi Shop Logo" 
              className="w-24 h-24 object-contain animate-pulse grayscale rounded-full" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      }>
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
  );
}
