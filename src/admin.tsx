import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminApp from './pages/AdminApp';
import './index.css';
import { DialogProvider } from './components/CustomDialogContext';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <ToastProvider>
          <AdminApp />
        </ToastProvider>
      </DialogProvider>
    </QueryClientProvider>
  </StrictMode>,
);
