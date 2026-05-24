/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "https://api.farcaster.xyz/miniapps/hosted-manifest/019e5a8d-ae85-3296-c843-323608dd4e70",
        permanent: false, // 307
      },
    ];
  },
  webpack: (config) => {
    // @xmtp/browser-sdk ships WebAssembly + workers
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};
module.exports = nextConfig;
