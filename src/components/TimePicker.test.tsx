import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TimePicker } from "./TimePicker";

function setup(overrides: Partial<React.ComponentProps<typeof TimePicker>> = {}) {
  const onStartChange = vi.fn();
  const onFinishChange = vi.fn();
  const onClear = vi.fn();
  render(
    <TimePicker
      startTime=""
      finishTime=""
      onStartChange={onStartChange}
      onFinishChange={onFinishChange}
      onClear={onClear}
      distanceKm={91}
      discipline="landevei"
      {...overrides}
    />,
  );
  return { onStartChange, onFinishChange, onClear };
}

describe("TimePicker speed chips", () => {
  it("renders speed chips when distanceKm is provided", () => {
    setup();
    expect(screen.getByText(/20 km\/t/)).toBeInTheDocument();
    expect(screen.getByText(/25 km\/t/)).toBeInTheDocument();
  });

  it("does not render speed chips when distanceKm is absent", () => {
    render(
      <TimePicker
        startTime=""
        finishTime=""
        onStartChange={vi.fn()}
        onFinishChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /km\/t/ })).toBeNull();
  });

  it("clicking a chip without start time does not call onFinishChange", () => {
    const { onFinishChange } = setup({ startTime: "" });
    fireEvent.click(screen.getByText(/20 km\/t/));
    expect(onFinishChange).not.toHaveBeenCalled();
  });

  it("clicking a chip with start time set computes and calls onFinishChange", () => {
    // 91 km at 20 km/h from 09:00 = 4h33m → 13:33
    const { onFinishChange } = setup({ startTime: "09:00" });
    fireEvent.click(screen.getByText(/20 km\/t/));
    expect(onFinishChange).toHaveBeenCalledWith("13:33");
  });

  it("pace chips shown for løping discipline", () => {
    setup({ discipline: "løping" });
    expect(screen.queryAllByRole("button", { name: /min\/km/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /km\/t/ })).toBeNull();
  });
});
