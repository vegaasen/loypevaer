import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as analytics from "../lib/analytics";
import { FeedbackButton } from "./FeedbackButton";

vi.mock("../lib/analytics", () => ({
  trackUserSuggestion: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/arrangement/birken" }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FeedbackButton", () => {
  it("renders a visible button", () => {
    render(<FeedbackButton />);
    expect(screen.getByRole("button", { name: /Tilbakemelding/i })).toBeInTheDocument();
  });

  it("opens modal when button is clicked", async () => {
    render(<FeedbackButton />);
    await userEvent.click(screen.getByRole("button", { name: /Tilbakemelding/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls trackUserSuggestion with text and pathname on submit", async () => {
    render(<FeedbackButton />);
    await userEvent.click(screen.getByRole("button", { name: /Tilbakemelding/i }));
    await userEvent.type(screen.getByRole("textbox"), "Bedre kart");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    expect(analytics.trackUserSuggestion).toHaveBeenCalledWith(
      "Bedre kart",
      "/arrangement/birken",
    );
  });

  it("shows confirmation message after submit", async () => {
    render(<FeedbackButton />);
    await userEvent.click(screen.getByRole("button", { name: /Tilbakemelding/i }));
    await userEvent.type(screen.getByRole("textbox"), "Bedre kart");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    expect(screen.getByText(/Takk for tilbakemeldingen/i)).toBeInTheDocument();
  });

  it("closes modal when Avbryt is clicked", async () => {
    render(<FeedbackButton />);
    await userEvent.click(screen.getByRole("button", { name: /Tilbakemelding/i }));
    await userEvent.click(screen.getByRole("button", { name: /Avbryt/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
