import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@orbe/db", "@orbe/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/ffmpeg-static/**/*"],
    "/app/**/*": ["./node_modules/ffmpeg-static/**/*"],
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
