import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ScrollToTopButton } from "./ScrollToTopButton";

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is not visible when scrollY is 0", () => {
    render(<ScrollToTopButton />);
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).not.toHaveClass("scroll-top-btn--visible");
  });

  it("becomes visible after scrolling past 300px", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 350, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).toHaveClass("scroll-top-btn--visible");
  });

  it("becomes hidden again when scrolling back above 300px", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 350, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).not.toHaveClass("scroll-top-btn--visible");
  });

  it("calls window.scrollTo({ top: 0, behavior: 'smooth' }) on click", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 400, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    fireEvent.click(screen.getByRole("button", { name: /tilbake til toppen/i }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
