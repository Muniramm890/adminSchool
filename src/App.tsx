// path: src/App.tsx

import { MainLayout } from './modules/core/MainLayout';
import { AuthProvider, DataProvider, SessionProvider } from './shared/context/AppContexts';
import { DialogProvider } from './shared/ui/DialogProvider';



// Naya Main App Export
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SessionProvider>
          <DialogProvider>
            <MainLayout />
          </DialogProvider>
        </SessionProvider>
      </DataProvider>
    </AuthProvider>
  );
}
