import '@/styles/globals.css';
import type { AppProps } from 'next/app';

// Import all the new wallet adapter stuff
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';

// Import the wallet adapter's CSS
require('@solana/wallet-adapter-react-ui/styles.css');

export default function App({ Component, pageProps }: AppProps) {
  // --- Start of Wallet-Adapter Setup ---
  
  // Set to 'mainnet-beta' or 'devnet'
  const network = WalletAdapterNetwork.Mainnet; 

  // You can also use 'devnet' or 'testnet'
  const endpoint = useMemo(() => `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, [network]);

  const wallets = useMemo(
    () => [
      // Add any wallets you want to support
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );
  // --- End of Wallet-Adapter Setup ---

  return (
    // Wrap your app in the providers
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}