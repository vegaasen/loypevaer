import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedbackModal } from "./FeedbackModal";

describe("FeedbackModal", () => {
  it("renders nothing when isOpen=false", () => {
    const { container } = render(
      <FeedbackModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders heading and textarea when isOpen=true", () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/Hva ønsker du å endre/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Avbryt/i })).toBeInTheDocument();
  });

  it("disables Send button when textarea is empty", () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Send/i })).toBeDisabled();
  });

  it("enables Send button when text is entered", async () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "Legg til temperatur");
    expect(screen.getByRole("button", { name: /Send/i })).not.toBeDisabled();
  });

  it("calls onSubmit with trimmed text and onClose when Send is clicked", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole("textbox"), "  Bedre kart  ");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    expect(onSubmit).toHaveBeenCalledWith("Bedre kart");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Avbryt is clicked", async () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "noe");
    await userEvent.click(screen.getByRole("button", { name: /Avbryt/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows character count", async () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "hei");
    expect(screen.getByText("3 / 280")).toBeInTheDocument();
  });

  it("resets textarea after Send", async () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "noe");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("resets textarea after Avbryt", async () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "noe");
    await userEvent.click(screen.getByRole("button", { name: /Avbryt/i }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
