import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { FloatingShortcutNav } from './components/FloatingShortcutNav';
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
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <img 
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
              alt="Orbi Shop" 
              className="w-28 h-28 object-contain relative z-10" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Orbi Shop</h2>
            <p className="text-sm font-medium text-slate-500">Loading secure marketplace...</p>
            <p className="text-xs text-slate-400">Checking products, sellers, and secure checkout</p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full w-full animate-pulse origin-left"></div>
          </div>
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
          <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <img 
                src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
                alt="Orbi Shop" 
                className="w-28 h-28 object-contain relative z-10" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Orbi Shop</h2>
              <p className="text-sm font-medium text-slate-500">Loading secure marketplace...</p>
              <p className="text-xs text-slate-400">Checking products, sellers, and secure checkout</p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full w-full animate-pulse origin-left"></div>
            </div>
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
      {/* Dynamic floating shortcut navigation bar to instantly toggle views - Dev Only */}
      <FloatingShortcutNav />
    </div>
  );
}
