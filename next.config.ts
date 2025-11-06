/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // This is the fix:
  // It tells Next.js to compile these packages.
  transpilePackages: [
    'react-ts-tradingview-widgets',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],
};

module.exports = nextConfig;