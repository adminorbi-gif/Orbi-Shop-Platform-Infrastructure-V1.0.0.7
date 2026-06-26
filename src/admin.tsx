import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AdminApp from './pages/AdminApp';
import './index.css';
import { DialogProvider } from './components/CustomDialogContext';
import { FloatingShortcutNav } from './components/FloatingShortcutNav';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <AdminApp />
      <FloatingShortcutNav />
    </DialogProvider>
  </StrictMode>,
);
