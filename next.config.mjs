/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return []
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  experimental: {
    serverActions: {}
  }
};

export default nextConfig;
