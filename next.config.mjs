/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // We're only transpiling the wallet adapters now
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],
};

// Use module.exports for CommonJS compatibility with Vercel's build
module.exports = nextConfig;