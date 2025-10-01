import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./components/AppRouter";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SearchProvider } from "./contexts/SearchContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { AuthProvider } from "./contexts/AuthContext";

// Verify database tables are ready
import "./utils/verifyTables";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <SearchProvider>
            <NotificationProvider>
              <UserPreferencesProvider>
                <AppRouter />
              </UserPreferencesProvider>
            </NotificationProvider>
          </SearchProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Initialize React app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
