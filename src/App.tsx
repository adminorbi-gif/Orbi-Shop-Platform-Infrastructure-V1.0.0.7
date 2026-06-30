import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ToastProvider } from './components/Toast';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <img 
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
              alt="Orbi Shop Logo" 
              className="relative w-28 h-28 object-contain animate-bounce drop-shadow-xl" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
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
    <ToastProvider>
      <div className="relative min-h-screen">
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 font-sans">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <img 
                  src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
                  alt="Orbi Shop Logo" 
                  className="relative w-28 h-28 object-contain animate-bounce drop-shadow-xl" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
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
      </div>
    </ToastProvider>
  );
}
