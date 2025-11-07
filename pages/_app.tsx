import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import { SessionProvider } from 'next-auth/react'; // <-- IMPORT SESSION PROVIDER

// Import the wallet adapter's CSS
import '@solana/wallet-adapter-react-ui/styles.css';
import { Header } from '../components/Header'; 

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  
  const network = WalletAdapterNetwork.Mainnet; 
  const endpoint = useMemo(
    () => `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    // 1. WRAP ENTIRE APP WITH SESSION PROVIDER
    <SessionProvider session={session}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="flex flex-col min-h-screen bg-gray-900 text-white">
              <Header />
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}