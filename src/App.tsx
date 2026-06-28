import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const ClientApp = lazy(() => import('./pages/ClientApp'));
const AdminApp = lazy(() => import('./pages/AdminApp'));

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md font-sans p-4">
              <img
                src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                alt="Orbi Shop"
                className="w-24 h-24 object-contain animate-pulse grayscale rounded-full"
                referrerPolicy="no-referrer"
              />
              <h2 className="mt-4 text-lg font-semibold text-slate-700">Loading secure marketplace…</h2>
              <p className="mt-2 text-sm text-slate-500">Checking products, sellers, and secure checkout</p>
            </div>
          }
        >
          <Routes>
            {/* Admin and Seller apps are handled by AdminApp for now */}
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/seller/*" element={<AdminApp />} />

            {/* Client-facing routes */}
            <Route path="/product/:slug" element={<ClientApp />} />
            <Route path="/checkout" element={<ClientApp />} />
            <Route path="/track/:orderId" element={<ClientApp />} />

            {/* Catch-all -> ClientApp (homepage, search, category, etc.) */}
            <Route path="/*" element={<ClientApp />} />
          </Routes>
        </Suspense>
      </div>

      {/* Floating shortcut navigation (kept for dev/internal use) */}
      {/* Itself will hide unless explicitly enabled in the FloatingShortcutNav component */}
    </BrowserRouter>
  );
}
