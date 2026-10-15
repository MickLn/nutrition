import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 100 % local : export statique, aucun serveur.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
