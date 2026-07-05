import { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { DialogProvider } from './components/CustomDialogContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { OrbiBootSplash, PwaExperience } from './components/PwaExperience';

const ClientApp = lazyWithRetry(() => import('./pages/ClientApp'));
const AdminApp = lazyWithRetry(() => import('./pages/AdminApp'));

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastProvider>
      <DialogProvider>
        <div className="relative min-h-screen">
          <PwaExperience />
          <Suspense fallback={<OrbiBootSplash />}>
            <Routes>
              {/* Client Routes */}
              <Route path="/" element={<ClientApp />} />
              <Route path="/product/:slug" element={<ClientApp />} />
              <Route path="/checkout" element={<ClientApp />} />
              <Route path="/track/:orderId" element={<ClientApp />} />
              
              {/* Seller Routes: separated from admin URLs for clean merchant indexing and sharing */}
              <Route path="/sellers" element={<AdminApp />} />
              <Route path="/sellers/login" element={<AdminApp />} />
              <Route path="/sellers/signup" element={<AdminApp />} />
              <Route path="/sellers/dashboard" element={<AdminApp />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminApp />} />
              
              {/* Fallback for older query-param style links */}
              <Route path="*" element={<ClientApp />} />
            </Routes>
          </Suspense>
        </div>
      </DialogProvider>
    </ToastProvider>
  );
}
