import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CookieBanner } from "./components/CookieBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { InstallBanner } from "./components/InstallBanner";
import { NavBar } from "./components/NavBar";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { SiteFooter } from "./components/SiteFooter";
import { usePageTracking } from "./hooks/usePageTracking";
import { useWeatherAlerts } from "./hooks/useWeatherAlerts";
import { restoreConsentFromStorage } from "./lib/analytics";
import { HomePage } from "./pages/HomePage";
import "./App.css";

// Restore previously stored consent so returning visitors don't lose their choice
restoreConsentFromStorage();

const EventPage = lazy(() => import("./pages/EventPage").then((m) => ({ default: m.EventPage })));
const GpxPage = lazy(() => import("./pages/GpxPage").then((m) => ({ default: m.GpxPage })));
const LopPage = lazy(() => import("./pages/LopPage").then((m) => ({ default: m.LopPage })));
const HvaErLoypevaerPage = lazy(() =>
  import("./pages/HvaErLoypevaerPage").then((m) => ({ default: m.HvaErLoypevaerPage })),
);
const EndringsloggPage = lazy(() =>
  import("./pages/EndringsloggPage").then((m) => ({ default: m.EndringsloggPage })),
);
const StatistikkPage = lazy(() =>
  import("./pages/StatistikkPage").then((m) => ({ default: m.StatistikkPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

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
          <Route path="/statistikk" element={<StatistikkPage />} />
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
