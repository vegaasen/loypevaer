import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Mock changelog.json so tests are deterministic
vi.mock("../data/changelog.json", () => ({
  default: [
    {
      sha: "abc1234def5678abc1234def5678abc1234def56",
      shortSha: "abc1234",
      date: "2025-05-01",
      type: "feat",
      scope: "birkebeiner",
      subject: "add waypoints for Birkebeinerrittet",
      githubUrl: "https://github.com/vegaasen/loypevaer/commit/abc1234def5678abc1234def5678abc1234def56",
    },
    {
      sha: "bbb0002bbb0002bbb0002bbb0002bbb0002bbb02",
      shortSha: "bbb0002",
      date: "2025-04-15",
      type: "fix",
      scope: null,
      subject: "correct altitude for Jotunheimen",
      githubUrl: "https://github.com/vegaasen/loypevaer/commit/bbb0002bbb0002bbb0002bbb0002bbb0002bbb02",
    },
    {
      sha: "ccc0003ccc0003ccc0003ccc0003ccc0003ccc03",
      shortSha: "ccc0003",
      date: "2025-03-10",
      type: "feat",
      scope: null,
      subject: "add triathlon discipline filter",
      githubUrl: "https://github.com/vegaasen/loypevaer/commit/ccc0003ccc0003ccc0003ccc0003ccc0003ccc03",
    },
  ],
}));

import { EndringsloggPage } from "./EndringsloggPage";

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <EndringsloggPage />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("EndringsloggPage", () => {
  it("renders a heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the correct number of entries", () => {
    renderPage();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders type badges for each entry", () => {
    renderPage();
    const featBadges = screen.getAllByText("feat", { selector: ".endringslogg__badge--feat" });
    expect(featBadges.length).toBeGreaterThan(0);
    const fixBadges = screen.getAllByText("fix", { selector: ".endringslogg__badge--fix" });
    expect(fixBadges.length).toBeGreaterThan(0);
  });

  it("renders scope tag when scope is present", () => {
    renderPage();
    expect(screen.getByText("birkebeiner")).toBeInTheDocument();
  });

  it("does not render scope tag when scope is null", () => {
    renderPage();
    // Second entry has scope=null; the subject contains "Jotunheimen"
    // We check there's only ONE scope span (for "birkebeiner")
    const scopes = document.querySelectorAll(".endringslogg__scope");
    expect(scopes).toHaveLength(1);
  });

  it("renders GitHub links with correct href", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /abc1234/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/vegaasen/loypevaer/commit/abc1234def5678abc1234def5678abc1234def56"
    );
  });

  it("renders short SHAs as link text", () => {
    renderPage();
    expect(screen.getByText("abc1234")).toBeInTheDocument();
    expect(screen.getByText("bbb0002")).toBeInTheDocument();
  });

  it("renders subject lines", () => {
    renderPage();
    expect(screen.getByText("add waypoints for Birkebeinerrittet")).toBeInTheDocument();
    expect(screen.getByText("correct altitude for Jotunheimen")).toBeInTheDocument();
  });
});

describe("EndringsloggPage — empty state", () => {
  it("renders empty state message when changelog is empty", async () => {
    vi.resetModules();
    vi.doMock("../data/changelog.json", () => ({ default: [] }));
    const { EndringsloggPage: Page } = await import("./EndringsloggPage");
    render(
      <HelmetProvider>
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(screen.getByText(/Ingen endringer registrert/)).toBeInTheDocument();
  });
});
