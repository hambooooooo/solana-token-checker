import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';

// Helper for number formatting
function formatWalletBalance(num: number | null) {
  if (num === null) return '...';
  return num.toFixed(2); // Simple 2-decimal format
}

export const WalletBalance = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!connection || !publicKey) {
      setSolBalance(null);
      setUsdBalance(null);
      return;
    }

    let isMounted = true;
    const getBalance = async () => {
      try {
        // 1. Fetch SOL Balance
        const lamports = await connection.getBalance(publicKey);
        const sol = lamports / LAMPORTS_PER_SOL;
        
        // 2. Fetch SOL Price (using a reliable SOL/USDC pair from DexScreener)
        const priceUrl = 'https://api.dexscreener.com/latest/dex/pairs/solana/8BnEgHoWFysVcuFFX7QztDmzu9DPm5EXxLrcGZJg2XYH';
        const priceRes = await fetch(priceUrl);
        if (!priceRes.ok) throw new Error('Failed to fetch SOL price');
        
        const priceData = await priceRes.json();
        const solPrice = parseFloat(priceData.pair.priceUsd);
        
        // 3. Calculate USD
        const usd = sol * solPrice;

        if (isMounted) {
          setSolBalance(sol);
          setUsdBalance(usd);
        }
      } catch (error) {
        console.error('Failed to get wallet balance:', error);
        if (isMounted) {
          setSolBalance(0); // Show 0 on error
          setUsdBalance(0);
        }
      }
    };

    getBalance();
    return () => { isMounted = false; };
  }, [connection, publicKey]); // Re-run when wallet connects

  // Don't render anything if wallet is not connected
  if (!publicKey) {
    return null; 
  }

  // Show a simple loader while fetching
  const isLoading = solBalance === null;

  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-md">
        <span>☀️</span>
        {isLoading ? (
          <div className="w-12 h-5 bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <span className="text-sm font-semibold text-white">{formatWalletBalance(solBalance)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-md">
        <span className="text-green-400">$</span>
        {isLoading ? (
          <div className="w-16 h-5 bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <span className="text-sm font-semibold text-white">{formatWalletBalance(usdBalance)}</span>
        )}
      </div>
    </div>
  );
};