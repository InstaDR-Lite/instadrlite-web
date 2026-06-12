/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your other config lines
  experimental: {
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;