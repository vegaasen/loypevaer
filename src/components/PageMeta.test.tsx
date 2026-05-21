import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { PageMeta } from "./PageMeta";

function renderMeta(props: Partial<Parameters<typeof PageMeta>[0]> = {}) {
  const defaults = {
    title: "Test title",
    description: "Test description",
    canonicalUrl: "https://www.løypevær.no/test",
  };
  return render(
    <HelmetProvider>
      <PageMeta {...defaults} {...props} />
    </HelmetProvider>
  );
}

describe("PageMeta", () => {
  it("renders twitter:card as summary_large_image", () => {
    renderMeta();
    const tag = document.head.querySelector('meta[name="twitter:card"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute("content")).toBe("summary_large_image");
  });

  it("renders og:image pointing to web-app-manifest-512x512.png", () => {
    renderMeta();
    const tag = document.head.querySelector('meta[property="og:image"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute("content")).toContain("web-app-manifest-512x512.png");
  });

  it("renders og:type as website by default", () => {
    renderMeta();
    const tag = document.head.querySelector('meta[property="og:type"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute("content")).toBe("website");
  });

  it("renders og:type as article when ogType prop is article", () => {
    renderMeta({ ogType: "article" });
    const tag = document.head.querySelector('meta[property="og:type"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute("content")).toBe("article");
  });
});
