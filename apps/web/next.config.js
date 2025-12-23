/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Disable image optimization for static export (required for Capacitor)
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for better mobile compatibility
  trailingSlash: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
};

module.exports = nextConfig;
