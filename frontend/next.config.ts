/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ideal-garbanzo-jj66rv7wg6g7hqx77-8080.app.github.dev/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;