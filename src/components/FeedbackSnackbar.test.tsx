import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackSnackbar } from "./FeedbackSnackbar";
import * as analytics from "../lib/analytics";

vi.mock("../hooks/useFeedbackPrompt", () => ({
  useFeedbackPrompt: vi.fn(),
}));

vi.mock("../lib/analytics", () => ({
  trackFeedback: vi.fn(),
}));

import { useFeedbackPrompt } from "../hooks/useFeedbackPrompt";
const mockUseFeedbackPrompt = vi.mocked(useFeedbackPrompt);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMock(visible: boolean) {
  const dismiss = vi.fn();
  mockUseFeedbackPrompt.mockReturnValue({ visible, dismiss });
  return dismiss;
}

describe("FeedbackSnackbar", () => {
  it("renders nothing when visible=false", () => {
    makeMock(false);
    const { container } = render(<FeedbackSnackbar eventId="test" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders question and buttons when visible=true", () => {
    makeMock(true);
    render(<FeedbackSnackbar eventId="test" />);
    expect(
      screen.getByText(/Er værmeldingen nyttig/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nyttig" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ikke nyttig" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lukk" })).toBeInTheDocument();
  });

  it("calls trackFeedback(5, eventId) and dismiss on 👍", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: "Nyttig" }));
    expect(analytics.trackFeedback).toHaveBeenCalledWith(5, "birken-2025");
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls trackFeedback(1, eventId) and dismiss on 👎", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: /Ikke nyttig/i }));
    expect(analytics.trackFeedback).toHaveBeenCalledWith(1, "birken-2025");
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls dismiss only (no trackFeedback) on ×", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: /Lukk/i }));
    expect(analytics.trackFeedback).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls dismiss (no trackFeedback) after 15s auto-dismiss", () => {
    vi.useFakeTimers();
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(analytics.trackFeedback).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
