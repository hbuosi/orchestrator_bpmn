/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'xlsx'],
  },
};

export default config;
