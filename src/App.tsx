import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./pages/HomePage";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { CookieBanner } from "./components/CookieBanner";
import { usePageTracking } from "./hooks/usePageTracking";
import { restoreConsentFromStorage } from "./lib/analytics";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { ScrollToTop } from "./components/ScrollToTop";
import { InstallBanner } from "./components/InstallBanner";
import { useWeatherAlerts } from "./hooks/useWeatherAlerts";
import "./App.css";

// Restore previously stored consent so returning visitors don't lose their choice
restoreConsentFromStorage();

const EventPage = lazy(() => import("./pages/EventPage").then((m) => ({ default: m.EventPage })));
const GpxPage = lazy(() => import("./pages/GpxPage").then((m) => ({ default: m.GpxPage })));
const LopPage = lazy(() => import("./pages/LopPage").then((m) => ({ default: m.LopPage })));
const HvaErLoypevaerPage = lazy(() => import("./pages/HvaErLoypevaerPage").then((m) => ({ default: m.HvaErLoypevaerPage })));
const EndringsloggPage = lazy(() => import("./pages/EndringsloggPage").then((m) => ({ default: m.EndringsloggPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
    },
  },
});

function RouterContent() {
  usePageTracking();
  useWeatherAlerts();
  return (
    <>
      <ScrollToTop />
      <NavBar />
      <InstallBanner />
      <Suspense fallback={<div className="page-loading" aria-label="Laster…" />}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/arrangement/:id" element={<EventPage />} />
          <Route path="/lop" element={<LopPage />} />
          <Route path="/gpx" element={<GpxPage />} />
          <Route path="/hva-er-loypevaer" element={<HvaErLoypevaerPage />} />
          <Route path="/hva-er-rittvaer" element={<Navigate to="/hva-er-loypevaer" replace />} />
          <Route path="/endringslogg" element={<EndringsloggPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SiteFooter />
      <ScrollToTopButton />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <RouterContent />
        </ErrorBoundary>
      </BrowserRouter>
      <ReloadPrompt />
      <CookieBanner />
    </QueryClientProvider>
  );
}

export default App;
