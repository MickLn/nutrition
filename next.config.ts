import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local d'abord : toutes les pages sont pré-rendues en statique ; seule la route /api/notion tourne sur Vercel.
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
