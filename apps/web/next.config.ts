import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { NextConfig } from "next";

// npm workspaces run this script with cwd = apps/web, but the single .env
// lives at the repo root — resolve it explicitly so env vars (e.g. Clerk
// keys) load regardless of how/where the process was launched from.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
