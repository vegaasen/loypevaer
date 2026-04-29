import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./pages/HomePage";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { usePageTracking } from "./hooks/usePageTracking";
import "./App.css";

const EventPage = lazy(() => import("./pages/EventPage").then((m) => ({ default: m.EventPage })));
const GpxPage = lazy(() => import("./pages/GpxPage").then((m) => ({ default: m.GpxPage })));
const LopPage = lazy(() => import("./pages/LopPage").then((m) => ({ default: m.LopPage })));
const HvaErRittvaerPage = lazy(() => import("./pages/HvaErRittvaerPage").then((m) => ({ default: m.HvaErRittvaerPage })));
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
  return (
    <>
      <NavBar />
      <Suspense fallback={<div className="page-loading" aria-label="Laster…" />}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/arrangement/:id" element={<EventPage />} />
          <Route path="/lop" element={<LopPage />} />
          <Route path="/gpx" element={<GpxPage />} />
          <Route path="/hva-er-rittvaer" element={<HvaErRittvaerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SiteFooter />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <RouterContent />
        </BrowserRouter>
        <ReloadPrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
