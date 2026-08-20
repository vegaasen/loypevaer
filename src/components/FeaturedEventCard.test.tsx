import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { FeaturedEventCard } from "./FeaturedEventCard";

function renderCard(props: Partial<Parameters<typeof FeaturedEventCard>[0]> = {}) {
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
      <FeaturedEventCard {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe("FeaturedEventCard", () => {
  it("renders event name, region, and distance", () => {
    renderCard();
    expect(screen.getByText("Birkebeinerrittet")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.className === "featured-card__meta" &&
          el.textContent?.includes("Innlandet") &&
          el.textContent?.includes("94 km"),
      ),
    ).toBeInTheDocument();
  });

  it("uses distanceLabel when provided", () => {
    renderCard({ distanceLabel: "750m / 20km / 5km" });
    expect(
      screen.getByText(
        (_, el) =>
          el?.className === "featured-card__meta" &&
          el.textContent?.includes("750m / 20km / 5km") === true,
      ),
    ).toBeInTheDocument();
  });

  it("renders discipline label", () => {
    renderCard({ discipline: "langrenn" });
    expect(screen.getByText("Langrenn")).toBeInTheDocument();
  });

  it("links to the arrangement page", () => {
    renderCard({ id: "my-event" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/arrangement/my-event");
  });

  it("renders countdown when provided", () => {
    renderCard({ countdown: "om 5 dager" });
    expect(screen.getByText("om 5 dager")).toBeInTheDocument();
  });

  it("does not render countdown for cancelled events", () => {
    renderCard({ countdown: "om 5 dager", dateStatus: "cancelled" });
    expect(screen.queryByText("om 5 dager")).not.toBeInTheDocument();
  });

  it("calls onTogglePlanned when bookmark button is clicked", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderCard({ onTogglePlanned: handler });
    await user.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("applies featured-card--past class when isPast=true", () => {
    renderCard({ isPast: true });
    expect(screen.getByRole("link")).toHaveClass("featured-card--past");
  });

  it("applies featured-card--cancelled class for cancelled events", () => {
    renderCard({ dateStatus: "cancelled" });
    expect(screen.getByRole("link")).toHaveClass("featured-card--cancelled");
  });

  it("applies featured-card--compact class when compact=true", () => {
    renderCard({ compact: true });
    expect(screen.getByRole("link")).toHaveClass("featured-card--compact");
  });

  it("does not apply featured-card--compact class by default", () => {
    renderCard();
    expect(screen.getByRole("link")).not.toHaveClass("featured-card--compact");
  });
});
