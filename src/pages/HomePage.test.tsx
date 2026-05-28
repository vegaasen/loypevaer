import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { FilterProvider } from "../context/FilterContext";
import { HomePage } from "./HomePage";

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <FilterProvider>
          <HomePage />
        </FilterProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("HomePage", () => {
  it("renders without errors", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("hero h1 contains the cycling weather word wrapper with correct aria-label", () => {
    renderPage();
    const wrapper = document.querySelector(".hero-weather-word");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute("aria-label", "Sjekk været");
  });

  it("cycling word wrapper contains 4 aria-hidden child spans", () => {
    renderPage();
    const wrapper = document.querySelector(".hero-weather-word");
    const children = wrapper?.querySelectorAll("span[aria-hidden='true']");
    expect(children).toHaveLength(4);
  });

  it("cycling word child spans contain the four weather words", () => {
    renderPage();
    const wrapper = document.querySelector(".hero-weather-word");
    const labels = Array.from(wrapper?.querySelectorAll("span") ?? []).map(
      (s) => s.textContent
    );
    expect(labels).toContain("Vind.");
    expect(labels).toContain("Sol.");
    expect(labels).toContain("Regn.");
    expect(labels).toContain("Snø.");
  });

  it("second line of h1 is still present", () => {
    renderPage();
    expect(screen.getByText(/Kom forberedt til start/)).toBeInTheDocument();
  });
});
