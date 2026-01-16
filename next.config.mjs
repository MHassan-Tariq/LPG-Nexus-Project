/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Increased for large backup files
    },
  },
};

export default nextConfig;
