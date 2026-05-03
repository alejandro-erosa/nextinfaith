import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { hostname: "sxeqazzypifkokvjenyg.supabase.co" },
      { hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
