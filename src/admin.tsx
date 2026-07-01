import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminApp from './pages/AdminApp';
import './index.css';
import { DialogProvider } from './components/CustomDialogContext';

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
        <AdminApp />
      </DialogProvider>
    </QueryClientProvider>
  </StrictMode>,
);
