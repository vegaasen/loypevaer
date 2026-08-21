import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FilterProvider } from "../context/FilterContext";
import { HomePage } from "./HomePage";
import { TAGLINES } from "./HomePage";

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <FilterProvider>
          <HomePage />
        </FilterProvider>
      </MemoryRouter>
    </HelmetProvider>,
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
    const labels = Array.from(wrapper?.querySelectorAll("span") ?? []).map((s) => s.textContent);
    expect(labels).toContain("Vind.");
    expect(labels).toContain("Sol.");
    expect(labels).toContain("Regn.");
    expect(labels).toContain("Snø.");
  });

  it("second line of h1 is one of the known taglines", () => {
    renderPage();
    const h1 = screen.getByRole("heading", { level: 1 });
    const text = h1.textContent ?? "";
    expect(TAGLINES.some((t) => text.includes(t))).toBe(true);
  });

  it("renders tidshorisont pills as buttons, not a select", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Alle arrangement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kommende" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arkiverte" })).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Filtrer etter tidshorisont" }),
    ).not.toBeInTheDocument();
  });
});
