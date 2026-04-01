import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config) => {
    const cwd = process.cwd();
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(cwd, "node_modules/react"),
      "react-dom": path.resolve(cwd, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(cwd, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(cwd, "node_modules/react/jsx-dev-runtime"),
      "scheduler": path.resolve(cwd, "node_modules/scheduler"),
    };
    return config;
  },
};

export default nextConfig;
