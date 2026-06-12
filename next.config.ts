import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: [
    "algo-x-evm-sdk",
    "@txnlab/use-wallet-ui-react",
    "@txnlab/use-wallet-react",
    "@rainbow-me/rainbowkit",
    "wagmi",
    "viem"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: "..",
    resolveAlias: {
      "@tanstack/react-query": "./node_modules/@tanstack/react-query",
    }
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@tanstack/react-query": path.resolve(__dirname, "node_modules/@tanstack/react-query"),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig;
