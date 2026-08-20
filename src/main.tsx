import { StrictMode } from "react";

history.scrollRestoration = "manual";

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./fonts.css";
import "./index.css";
import App from "./App.tsx";
import { FilterProvider } from "./context/FilterContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <FilterProvider>
        <App />
      </FilterProvider>
    </HelmetProvider>
  </StrictMode>,
);
