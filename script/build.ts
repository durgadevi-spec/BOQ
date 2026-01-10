import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// server deps to bundle to reduce openat(2) syscalls
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm(path.resolve(__dirname, "../dist"), {
    recursive: true,
    force: true,
  });

  /* ================= CLIENT ================= */
  console.log("building client...");
  await viteBuild({
    root: path.resolve(__dirname, "../client"),
    build: {
      outDir: path.resolve(__dirname, "../dist/public"),
      emptyOutDir: true,
    },
  });

  /* ================= SERVER ================= */
  console.log("building server...");
  const pkg = JSON.parse(
    await readFile(path.resolve(__dirname, "../package.json"), "utf-8")
  );

  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: [path.resolve(__dirname, "../server/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(__dirname, "../dist/index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
