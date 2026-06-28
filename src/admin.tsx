import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AdminApp from './pages/AdminApp';
import './index.css';
import { DialogProvider } from './components/CustomDialogContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <AdminApp />
    </DialogProvider>
  </StrictMode>,
);
