import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

// Only load dev plugins if in development
const isDev = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

// Lazy load dev-only plugins
async function getDevPlugins() {
  if (!isDev) return [];

  const { cartographer } = await import("@replit/vite-plugin-cartographer");
  const { devBanner } = await import("@replit/vite-plugin-dev-banner");
  const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");

  return [cartographer(), devBanner(), runtimeErrorOverlay()];
}

export default defineConfig(async () => {
  const devPlugins = await getDevPlugins();

  return {
    plugins: [
      react(),
      tailwindcss(),
      metaImagesPlugin(),
      ...devPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.url, "../client/src"),
        "@shared": path.resolve(import.meta.url, "../shared"),
        "@assets": path.resolve(import.meta.url, "../attached_assets"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    root: path.resolve(import.meta.url, "../client"),
    build: {
      outDir: path.resolve(import.meta.url, "../dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
