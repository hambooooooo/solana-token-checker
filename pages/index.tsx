import { useState } from 'react';
import type { SafetyReport } from '@/lib/helius';
import Head from 'next/head'; 
import { Inter } from 'next/font/google';

// --- IMPORTS ---
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// We no longer need the TradingView import
// -----------------

const inter = Inter({ subsets: ['latin'] });

type Report = SafetyReport; 

// --- Helper Functions (Unchanged) ---
function formatNumber(num: number): string {
  if (!num) return '0';
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return `${(num / 1_000_000_000).toFixed(1)}B`;
}
function formatUSD(value: string | number | undefined): string {
  const num = parseFloat(String(value)); 
  if (isNaN(num)) return '$0.00';
  if (num === 0) return '$0.00';
  if (num < 0.01) return `$${num.toPrecision(4)}`;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
function formatNativePrice(value: string | number | undefined): string {
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0';
  return num.toPrecision(4); 
}
function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
// -----------------------------


export default function Home() {
  const [mintAddress, setMintAddress] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      const response = await fetch(`/api/check/${mintAddress}`);
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errData = await response.json();
          errorMessage = errData.error || 'Failed to fetch report.';
        } catch (parseError) {
          errorMessage = `Server Error: ${response.status} (${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data: Report = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Solana Token Analyzer</title>
        <meta name="description" content="Check Solana SPL tokens for safety, market data, and charts." />
      </Head>
      
      <header className="w-full p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Solana Token Analyzer</h1>
        <WalletMultiButton />
      </header>

      <div className={`flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 md:p-8 ${inter.className}`}>
        <main className="w-full max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
            Token Dashboard
          </h2>
          <p className="text-center text-gray-400 mb-6">
            Get safety checks, market data, and live charts for any SPL token.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="Paste SPL Token Mint Address..."
              className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 font-semibold bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Check'}
            </button>
          </form>

          <div className="mt-6">
            {error && <ErrorMessage message={error} />}
            {report && <ReportCard report={report} />}
            {!isLoading && !error && !report && <InfoBox />}
          </div>
          
          <Disclaimer />
        </main>
      </div>
    </>
  );
}

// --- Sub-Components ---

const ReportCard = ({ report }: { report: Report }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
    <div className="p-4 md:p-6 bg-gray-800">
      <h2 className="text-3xl font-bold">{report.tokenInfo.name} ({report.tokenInfo.symbol})</h2>
    </div>
    <div className="border-t border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Official Links</h3>
      <SocialLinks links={report.tokenInfo.links} />
    </div>
    <div className="border-t border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Live Chart</h3>
      {/* --- CHART COMPONENT SWAPPED BACK --- */}
      <DexScreenerChart pair={report.dexScreenerPair} />
    </div>
    <div className="border-t border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Market Data</h3>
      <MarketDataDashboard pair={report.dexScreenerPair} marketCap={report.marketCap} />
    </div>
    <div className="border-t border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Safety Report</h3>
      <div className="space-y-4">
        <ReportItem item={report.mintAuthority} />
        <ReportItem item={report.freezeAuthority} />
        <ReportItem item={report.holderDistribution} />
        <ReportItem item={report.metadata} />
        <ReportItem item={report.liquidity} />
      </div>
    </div>
  </div>
);

/**
 * --- THIS IS THE FIXED DEXSCREENER CHART ---
 * It uses the 'embed' URL and is styled to look professional.
 */
const DexScreenerChart = ({ pair }: { pair: any }) => {
  if (!pair?.url) {
    return <p className="text-sm text-gray-500">No trading chart found.</p>;
  }
  
  // This is the clean, dark-mode, chart-only URL
  const chartUrl = `${pair.url.replace('/dex/', '/embed/')}?theme=dark`;

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-700">
      <iframe
        src={chartUrl}
        className="w-full h-full"
        title="DexScreener Chart"
        allow="fullscreen"
      />
    </div>
  );
};

// --- Other Components (Unchanged) ---

const MarketDataDashboard = ({ pair, marketCap }: { pair: any, marketCap: number }) => {
  if (!pair) {
    return <p className="text-sm text-gray-500">No market data found for this token.</p>;
  }
  const txns = pair.txns?.h24 || { buys: 0, sells: 0 };
  const volume = pair.volume?.h24 || 0;
  const priceChange = pair.priceChange?.h24 || 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard 
        title="Price USD" 
        value={formatUSD(pair.priceUsd)}
        change={priceChange}
      />
      <StatCard 
        title={`Price ${pair.quoteToken.symbol}`}
        value={formatNativePrice(pair.priceNative)} 
      />
      <StatCard 
        title="Market Cap" 
        value={marketCap > 0 ? formatUSD(marketCap) : 'N/A'}
        tooltip="Market Cap provided by Helius"
      />
      <StatCard 
        title="FDV" 
        value={formatUSD(pair.fdv)}
        tooltip="Fully Diluted Valuation from DexScreener"
      />
      <StatCard 
        title="Liquidity" 
        value={formatUSD(pair.liquidity.usd)}
      />
      <StatCard 
        title="24h Volume" 
        value={formatUSD(volume)}
      />
      <StatCard 
        title="24h Transactions" 
        value={formatNumber(txns.buys + txns.sells)}
      />
      <StatCard 
        title="Buys vs Sells (24h)" 
        value={`${formatNumber(txns.buys)} / ${formatNumber(txns.sells)}`}
      />
      <StatCard 
        title="Pair Created" 
        value={formatDate(pair.pairCreatedAt)}
      />
      <StatCard 
        title="Pooled Token" 
        value={`${formatNumber(pair.liquidity.base)} ${pair.baseToken.symbol}`}
      />
      <StatCard 
        title={`Pooled ${pair.quoteToken.symbol}`}
        value={`${formatNumber(pair.liquidity.quote)} ${pair.quoteToken.symbol}`}
      />
      <StatCard 
        title="Pair Address" 
        value={`${pair.pairAddress.substring(0, 6)}...${pair.pairAddress.substring(pair.pairAddress.length - 4)}`}
      />
    </div>
  );
};

const StatCard = ({ title, value, change, tooltip }: { title: string, value: string, change?: number, tooltip?: string }) => (
  <div className="bg-gray-700 p-4 rounded-lg" title={tooltip}>
    <p className="text-sm text-gray-400 truncate">{title}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-xl lg:text-2xl font-bold truncate">{value}</p>
      {change != null && ( 
        <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
          {change.toFixed(1)}%
        </span>
      )}
    </div>
  </div>
);

const SocialLinks = ({ links }: { links: any }) => {
  const createLink = (name: string, url: string) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm hover:bg-gray-600 transition-colors"
      >
        {name}
      </a>
    );
  };
  const allLinks = [
    createLink('Website', links.website),
    createLink('Twitter', links.twitter),
    createLink('Telegram', links.telegram),
    createLink('Discord', links.discord),
  ].filter(Boolean); 
  if (allLinks.length === 0) {
    return <p className="text-sm text-gray-500">No official links found.</p>;
  }
  return <div className="flex flex-wrap gap-2">{allLinks}</div>;
};

const ReportItem = ({ item }: { item: { status: string; message: string } }) => {
  const { message } = item;
  const icon = message.startsWith('✅') ? '✅' : message.startsWith('⚠️') ? '⚠️' : '❌';
  let textColor = 'text-green-400';
  if (icon === '⚠️') textColor = 'text-yellow-400';
  if (icon === '❌') textColor = 'text-red-400';
  return (
    <div className={`flex items-start ${textColor}`}>
      <span className="text-xl mr-3">{icon}</span>
      <p className="text-gray-100">{message.substring(2)}</p>
    </div>
  );
};

const Disclaimer = () => (
  <div className="mt-8 p-4 bg-yellow-900 border border-yellow-700 rounded-md text-yellow-100">
    <h3 className="font-bold text-lg mb-2">⚠️ THIS IS NOT FINANCIAL ADVICE</h3>
    <p className="text-sm">
      This is an automated tool and not an endorsement. A high safety score does
      not guarantee a good investment. Many 'safe' tokens still fail. 'Unsafe'
      tokens may be for legitimate, in-progress projects. Always do your
      own research (DYOR).
    </p>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="p-4 bg-red-900 border border-red-700 rounded-md text-red-100">
    <p><strong>Error:</strong> {message}</p>
  </div>
);

const InfoBox = () => (
  <div className="p-8 text-center bg-gray-800 border border-gray-700 rounded-lg">
    <p className="text-gray-400">
      Your token report will appear here.
    </p>
  </div>
);