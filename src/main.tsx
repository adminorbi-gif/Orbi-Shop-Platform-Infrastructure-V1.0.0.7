import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { DialogProvider } from './components/CustomDialogContext.tsx';
import { aiPilotEngine } from './engine/AIPilotEngine';
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    },
  },
});

// Safe LocalStorage polyfill for sandboxed iframes
try {
  const testKey = "__orbi_test_ls__";
  window.localStorage.setItem(testKey, "1");
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("LocalStorage is not accessible. Polyfilling with in-memory storage.");
  const memoryStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string): string | null => {
      return key in memoryStore ? memoryStore[key] : null;
    },
    setItem: (key: string, value: string): void => {
      memoryStore[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete memoryStore[key];
    },
    clear: (): void => {
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    },
    key: (index: number): string | null => {
      const keys = Object.keys(memoryStore);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    get length(): number {
      return Object.keys(memoryStore).length;
    }
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  } catch (defineError) {
    try {
      (window as any).localStorage = mockLocalStorage;
    } catch (assignError) {
      console.error("Could not override window.localStorage:", assignError);
    }
  }
}

// Start the background engine for platform-wide automated tasks.
// Delay it to prevent blocking the initial render.
setTimeout(() => {
  aiPilotEngine.start();
}, 2000);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Orbi Shop PWA service worker registration failed:", error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DialogProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
