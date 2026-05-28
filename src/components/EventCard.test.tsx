import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EventCard } from "./EventCard";

function renderCard(props: Partial<Parameters<typeof EventCard>[0]> = {}) {
  const defaults = {
    id: "test-event",
    name: "Birkebeinerrittet",
    officialDate: "2025-08-23",
    distance: 94,
    region: "Innlandet",
    discipline: "landevei" as const,
  };
  return render(
    <MemoryRouter>
      <EventCard {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe("EventCard", () => {
  it("renders event name", () => {
    renderCard();
    expect(screen.getByText("Birkebeinerrittet")).toBeInTheDocument();
  });

  it("renders region and distance", () => {
    renderCard();
    expect(screen.getByText("Innlandet")).toBeInTheDocument();
    expect(screen.getByText("94 km")).toBeInTheDocument();
  });

  it("uses distanceLabel when provided", () => {
    renderCard({ distanceLabel: "750m / 20km / 5km" });
    expect(screen.getByText("750m / 20km / 5km")).toBeInTheDocument();
    expect(screen.queryByText("94 km")).not.toBeInTheDocument();
  });

  it("renders discipline label", () => {
    renderCard({ discipline: "langrenn" });
    expect(screen.getByText("Langrenn")).toBeInTheDocument();
  });

  it("renders formatted Norwegian date", () => {
    renderCard({ officialDate: "2025-08-23" });
    expect(screen.getByText(/23\. august 2025/)).toBeInTheDocument();
  });

  it("renders countdown when provided", () => {
    renderCard({ countdown: "om 5 dager" });
    expect(screen.getByText("om 5 dager")).toBeInTheDocument();
  });

  it("does not render countdown for cancelled events", () => {
    renderCard({ countdown: "om 5 dager", dateStatus: "cancelled" });
    expect(screen.queryByText("om 5 dager")).not.toBeInTheDocument();
  });

  it("shows Avlyst badge for cancelled events", () => {
    renderCard({ dateStatus: "cancelled" });
    expect(screen.getByText("Avlyst")).toBeInTheDocument();
  });

  it("shows Tentativ dato badge for pending events", () => {
    renderCard({ dateStatus: "pending" });
    expect(screen.getByText("Tentativ dato")).toBeInTheDocument();
  });

  it("links to the arrangement page", () => {
    renderCard({ id: "my-event" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/arrangement/my-event");
  });

  it("renders the bookmark button when onTogglePlanned is provided", () => {
    renderCard({ onTogglePlanned: () => {} });
    expect(screen.getByRole("button", { name: /legg til/i })).toBeInTheDocument();
  });

  it("shows saved state when planned=true", () => {
    renderCard({ planned: true, onTogglePlanned: () => {} });
    expect(screen.getByRole("button", { name: /fjern fra/i })).toBeInTheDocument();
    expect(screen.getByText("Lagret")).toBeInTheDocument();
  });

  it("calls onTogglePlanned when bookmark button is clicked", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderCard({ onTogglePlanned: handler });
    await user.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("applies ritt-card--past class when isPast=true", () => {
    renderCard({ isPast: true });
    expect(screen.getByRole("link")).toHaveClass("ritt-card--past");
  });

  it("applies ritt-card--cancelled class for cancelled events", () => {
    renderCard({ dateStatus: "cancelled" });
    expect(screen.getByRole("link")).toHaveClass("ritt-card--cancelled");
  });

  it("applies ritt-card--past-compact when isPast=true and not planned and not cancelled", () => {
    renderCard({ isPast: true });
    expect(screen.getByRole("link")).toHaveClass("ritt-card--past-compact");
  });

  it("does NOT apply ritt-card--past-compact when isPast=true but planned=true", () => {
    renderCard({ isPast: true, planned: true });
    expect(screen.getByRole("link")).not.toHaveClass("ritt-card--past-compact");
  });

  it("does NOT apply ritt-card--past-compact when isPast=true but cancelled", () => {
    renderCard({ isPast: true, dateStatus: "cancelled" });
    expect(screen.getByRole("link")).not.toHaveClass("ritt-card--past-compact");
  });

  it("sets data-date attribute on compact past card", () => {
    renderCard({ isPast: true, officialDate: "2025-03-14" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-date");
  });
});
