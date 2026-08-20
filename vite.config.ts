/// <reference types="vitest" />

import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * Injects <link rel="preload"> hints for Inter woff2 fonts into the built index.html.
 * Font filenames are content-hashed, so we inject them in generateBundle rather than
 * hardcoding them in index.html.
 */
function fontPreloadPlugin(base: string): Plugin {
  const interFontRe = /^assets\/inter-latin(-ext)?-wght-normal-[^.]+\.woff2$/;
  return {
    name: "font-preload",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const preloadTags = Object.keys(bundle)
          .filter((name) => interFontRe.test(name))
          .map(
            (name) =>
              `  <link rel="preload" as="font" type="font/woff2" crossorigin href="${base}${name}">`,
          )
          .join("\n");
        if (!preloadTags) return html;
        return html.replace("</head>", `${preloadTags}\n</head>`);
      },
    },
  };
}

function getGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

// Base path is /loypevaer/ only when deploying to GitHub Pages.
// AWS (CloudFront + custom domain) and local dev both use /.
const base = process.env.DEPLOY_TARGET === "github-pages" ? "/loypevaer/" : "/";

const appVersion = getGitSha();

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    fontPreloadPlugin(base),
    VitePWA({
      registerType: "prompt",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Løypevær",
        short_name: "Løypevær",
        description: "Sjekk været langs ruten for norske sykkelritt, langrenn, triathlon og løp.",
        theme_color: "#1a3300",
        background_color: "#f7f5ef",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: process.env.NODE_ENV === "development" ? [] : ["**/*.{js,css,html,ico,png,svg,woff2}", "weather-cache.json"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "open-meteo-api",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 48, // 48 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/archive-api\.open-meteo\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "open-meteo-archive",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 48, // 48 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.met\.no\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "yr-api",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 48, // 48 hours
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    open: true,
  },
  build: {
    modulePreload: {
      // Targeting evergreen browsers (Safari 17+, Firefox 115+, Chrome 108+) — legacy polyfill not needed
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet")) return "vendor-leaflet";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router")
          )
            return "vendor-react";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
  },
});
