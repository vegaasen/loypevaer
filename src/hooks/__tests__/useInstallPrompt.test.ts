// @vitest-environment jsdom
// src/hooks/__tests__/useInstallPrompt.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInstallPrompt } from "../useInstallPrompt";

// Provide a working localStorage in environments where it may be unavailable (Node 26+)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

describe("useInstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("canInstall is false initially", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("canInstall becomes true when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event: Event = new Event("beforeinstallprompt");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event as any).prompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);
  });

  it("canInstall is false when pwa-install-dismissed is set", () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    const { result } = renderHook(() => useInstallPrompt());
    const event: Event = new Event("beforeinstallprompt");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event as any).prompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(false);
  });

  it("promptInstall calls prompt() on the deferred event", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const mockPrompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    const event: Event = new Event("beforeinstallprompt");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event as any).prompt = mockPrompt;
    act(() => {
      window.dispatchEvent(event);
    });
    await act(async () => {
      await result.current.promptInstall();
    });
    expect(mockPrompt).toHaveBeenCalled();
  });

  it("dismiss sets localStorage and clears canInstall", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event: Event = new Event("beforeinstallprompt");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event as any).prompt = vi.fn().mockResolvedValue({ outcome: "dismissed" });
    act(() => {
      window.dispatchEvent(event);
    });
    act(() => {
      result.current.dismiss();
    });
    expect(localStorage.getItem("pwa-install-dismissed")).toBe("1");
    expect(result.current.canInstall).toBe(false);
  });

  it("iosDismissed is false initially", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.iosDismissed).toBe(false);
  });

  it("iosDismissed becomes true after dismiss()", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.iosDismissed).toBe(true);
    expect(localStorage.getItem("pwa-ios-install-dismissed")).toBe("1");
  });

  it("iosDismissed is true when pwa-ios-install-dismissed is pre-set in localStorage", () => {
    localStorage.setItem("pwa-ios-install-dismissed", "1");
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.iosDismissed).toBe(true);
  });
});
