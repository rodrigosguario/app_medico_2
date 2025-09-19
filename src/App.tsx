import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, AuthGuard } from "@/components/AuthGuard";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import FinancialPage from "./pages/FinancialPage";
import ImportExportPage from "./pages/ImportExportPage";
import OfflinePage from "./pages/OfflinePage";
import SettingsPage from "./pages/SettingsPage";
import TestPage from "./pages/TestPage";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";
import { MobileOptimization } from '@/components/MobileOptimization';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <MobileOptimization />
        <Toaster />
        <Sonner />
        {/* NÃO use BrowserRouter aqui. O Router já está em main.tsx (HashRouter). */}
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/import-export" element={<ImportExportPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            {/* catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGuard>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
