import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { metaImagesPlugin } from "./vite-plugin-meta-images";
import { fileURLToPath, URL } from "node:url";

// Detect development
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

  const clientPath = fileURLToPath(new URL("../client", import.meta.url));
  const distPath = fileURLToPath(new URL("../dist/public", import.meta.url));

  return {
    root: clientPath,
    plugins: [
      react(),
      tailwindcss(),
      metaImagesPlugin(),
      ...devPlugins,
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("../client/src", import.meta.url)),
        "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        "@assets": fileURLToPath(new URL("../attached_assets", import.meta.url)),
      },
    },
    build: {
      outDir: distPath,
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
