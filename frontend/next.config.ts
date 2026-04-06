/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => [
    {
      source: '/api/parse',
      destination: 'http://localhost:8080/api/parse',
    },
  ],
};

module.exports = nextConfig;