import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  compiler: {
    removeConsole: true,
  },
  async redirects() {
    return [
      {
        source: '/documentation/index.html',
        destination: '/documentation',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
