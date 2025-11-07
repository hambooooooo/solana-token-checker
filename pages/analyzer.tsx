import { useState, useEffect } from 'react';
import type { SafetyReport } from '@/lib/helius';
import Head from 'next/head'; 
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router'; 
import { motion, AnimatePresence } from 'framer-motion'; 

const inter = Inter({ subsets: ['latin'] });

type Report = SafetyReport; 

// --- (All Helper Functions and Components go here) ---
// --- Helper Functions ---
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
// --- NEW: Shorten wallet address ---
function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}

// --- SAFETY SCORING LOGIC ---
type SafetyScore = {
  score: number;
  color: string;
  rating: string;
};

function calculateSafetyScore(report: Report): SafetyScore {
  let score = 0;
  const checks = [
    report.mintAuthority,
    report.freezeAuthority,
    report.holderDistribution,
    report.metadata,
    report.liquidity, 
  ];

  for (const check of checks) {
    if (check.status === 'pass') {
      score += 20;
    } else if (check.status === 'warn') {
      score += 10;
    }
  }

  let color: string;
  let rating: string;

  if (score >= 80) {
    color = "#22c55e"; // green-500
    rating = "Safe";
  } else if (score >= 50) {
    color = "#eab308"; // yellow-500
    rating = "Caution";
  } else {
    color = "#ef4444"; // red-500
    rating = "Risky";
  }

  return { score, color, rating };
}

// --- Card component (reusable) ---
const Card: React.FC<{ children: React.ReactNode, className?: string, style?: React.CSSProperties }> = 
  ({ children, className = '', style }) => {
  return (
    <motion.div
      className={`bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6 ${className}`}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// --- Safety Meter ---
const SafetyMeter = ({ score, color, rating }: SafetyScore) => {
  const circumference = 2 * Math.PI * 60; 
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="" style={{ boxShadow: `0 0 25px ${color}30` }}>
      <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Safety Score</h3>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" stroke="#374151" strokeWidth="12" fill="transparent" />
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              stroke={color}
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: color }}>
              {score}
            </span>
            <span className="text-sm text-gray-400">/ 100</span>
          </div>
        </div>
        <motion.div
          className="mt-4 px-4 py-1.5 rounded-full text-lg font-semibold"
          style={{ backgroundColor: `${color}20`, color: color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          {rating}
        </motion.div>
      </div>
    </Card>
  );
};

// --- NEW: TOP HOLDERS CARD ---
const TopHoldersCard = ({ holders, totalSupply, symbol }: { holders: any[], totalSupply: number, symbol: string }) => {
  if (!holders || holders.length === 0 || totalSupply === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Top Holders</h3>
        <p className="text-gray-500">No holder data available.</p>
      </Card>
    );
  }

  const top10 = holders.slice(0, 10);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Top 10 Holders</h3>
      <div className="space-y-3">
        {top10.map((holder, index) => {
          const percentage = (parseFloat(holder.uiAmount) / totalSupply) * 100;
          return (
            <div key={holder.address} className="flex justify-between items-center text-sm">
              <span className="text-gray-400">#{index + 1}</span>
              <a 
                href={`https://solscan.io/account/${holder.address}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                {shortenAddress(holder.address)}
              </a>
              <span className="text-white font-semibold">{percentage.toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};


// --- Report Card (Main Layout) ---
const ReportCard = ({ 
  report, 
  mintAddress, 
}: { 
  report: Report, 
  mintAddress: string,
}) => {
  const safetyScore = calculateSafetyScore(report);
  const raydiumUrl = `https://raydium.io/swap/?outputMint=${mintAddress}`;
  const birdeyeUrl = `https://birdeye.so/token/${mintAddress}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card className="mb-6">
        <h2 className="text-3xl font-bold text-center mb-4">{report.tokenInfo.name} ({report.tokenInfo.symbol})</h2>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <a href={raydiumUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors">
            Buy on Raydium
          </a>
          <a href={birdeyeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
            View on Birdeye
          </a>
        </div>
        <SocialLinks links={report.tokenInfo.links} />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        <div className="lg:col-span-1 space-y-6">
          <SafetyMeter key={safetyScore.score} {...safetyScore} />
          <Card>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Safety Details</h3>
            <div className="space-y-3">
              <ReportItem item={report.mintAuthority} />
              <ReportItem item={report.freezeAuthority} />
              <ReportItem item={report.holderDistribution} />
              <ReportItem item={report.metadata} />
              <ReportItem item={report.liquidity} />
            </div>
          </Card>
          {/* --- ADD THE NEW CARD TO THE SIDEBAR --- */}
          <TopHoldersCard 
            holders={report.holderDistribution.holders} 
            totalSupply={report.totalSupply}
            symbol={report.tokenInfo.symbol}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Live Chart</h3>
            <DexScreenerChart pair={report.dexScreenerPair} />
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Market Data</h3>
            <MarketDataDashboard pair={report.dexScreenerPair} marketCap={report.marketCap} />
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

// --- DexScreener Chart ---
const DexScreenerChart = ({ pair }: { pair: any }) => {
  if (!pair?.url) {
    return <p className="text-sm text-gray-500">No trading chart found.</p>;
  }
  const chartUrl = `${pair.url.replace('/dex/', '/embed/')}?theme=dark&info=false`;
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-gray-700">
      <iframe src={chartUrl} className="w-full h-full" title="DexScreener Chart" allow="fullscreen" />
    </div>
  );
};

// --- Market Data ---
const MarketDataDashboard = ({ pair, marketCap }: { pair: any, marketCap: number }) => {
  if (!pair) {
    return <p className="text-sm text-gray-500">No market data found for this token.</p>;
  }
  const txns = pair.txns?.h24 || { buys: 0, sells: 0 };
  const volume = pair.volume?.h24 || 0;
  const priceChange = pair.priceChange?.h24 || 0;
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard title="Price USD" value={formatUSD(pair.priceUsd)} change={priceChange} />
      <StatCard title={`Price ${pair.quoteToken.symbol}`} value={formatNativePrice(pair.priceNative)} />
      <StatCard title="Market Cap" value={marketCap > 0 ? formatUSD(marketCap) : 'N/A'} tooltip="Market Cap provided by Helius" />
      <StatCard title="FDV" value={formatUSD(pair.fdv)} tooltip="Fully Diluted Valuation from DexScreener" />
      <StatCard title="Liquidity" value={formatUSD(pair.liquidity.usd)} />
      <StatCard title="24h Volume" value={formatUSD(volume)} />
      <StatCard title="24h Transactions" value={formatNumber(txns.buys + txns.sells)} />
      <StatCard title="Buys vs Sells (24h)" value={`${formatNumber(txns.buys)} / ${formatNumber(txns.sells)}`} />
      <StatCard title="Pair Created" value={formatDate(pair.pairCreatedAt)} />
      <StatCard title="Pair Address" value={`${pair.pairAddress.substring(0, 4)}...${pair.pairAddress.substring(pair.pairAddress.length - 4)}`} />
    </div>
  );
};

// --- Stat Card ---
const StatCard = ({ title, value, change, tooltip }: { title: string, value: string, change?: number, tooltip?: string }) => (
  <div className="bg-gray-700/50 p-4 rounded-lg" title={tooltip}>
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

// --- Social Links ---
const SocialLinks = ({ links }: { links: any }) => {
  const createLink = (name: string, url: string) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm hover:bg-gray-600 transition-colors">
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
    return <p className="text-sm text-center text-gray-500">No official links found.</p>;
  }
  return <div className="flex flex-wrap gap-2 justify-center">{allLinks}</div>;
};

// --- Report Item ---
const ReportItem = ({ item }: { item: { status: string; message: string } }) => {
  const { message } = item;
  const icon = message.startsWith('✅') ? '✅' : message.startsWith('⚠️') ? '⚠️' : '❌';
  let textColor = 'text-green-400';
  if (icon === '⚠️') textColor = 'text-yellow-400';
  if (icon === '❌') textColor = 'text-red-400'; 
  return (
    <div className={`flex items-start ${textColor} p-3 rounded-lg transition-colors hover:bg-gray-700/50`}>
      <span className="text-xl mr-3 mt-0.5">{icon}</span>
      <p className="text-gray-100">{message.substring(2)}</p>
    </div>
  );
};

// --- Disclaimer ---
const Disclaimer = () => (
  <div className="mt-8 p-4 bg-yellow-900 border border-yellow-700 rounded-md text-yellow-100 max-w-4xl mx-auto">
    <h3 className="font-bold text-lg mb-2">⚠️ THIS IS NOT FINANCIAL ADVICE</h3>
    <p className="text-sm">
      This is an automated tool and not an endorsement. A high safety score does
      not guarantee a good investment. Many 'safe' tokens still fail. 'Unsafe'
      tokens may be for legitimate, in-progress projects. Always do your
      own research (DYOR).
    </p>
  </div>
);

// --- Error Message ---
const ErrorMessage = ({ message }: { message: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <div className="p-4 bg-red-900 border border-red-700 rounded-md text-red-100 max-w-2xl mx-auto">
      <p><strong>Error:</strong> {message}</p>
    </div>
  </motion.div>
);

// --- Info Box ---
const InfoBox = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="p-12 text-center bg-gray-800 border border-gray-700 rounded-lg max-w-2xl mx-auto"
  >
    <p className="text-gray-400">
      Please enter a token address in the search bar above to begin.
    </p>
  </motion.div>
);
// --- (End of components) ---


// --- Main Analyzer Page Component ---
export default function Analyzer() {
  const router = useRouter();
  const [mintAddress, setMintAddress] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function fetches the report
  const fetchReport = async (mint: string) => {
    if (!mint) return;
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      // Update URL without reloading page
      router.push(`/analyzer?mint=${mint}`, undefined, { shallow: true });
      
      const response = await fetch(`/api/check/${mint}`);
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

  // This fetches the report on page load if 'mint' is in the URL
  useEffect(() => {
    if (router.isReady) {
      const { mint } = router.query;
      if (typeof mint === 'string' && mint) {
        setMintAddress(mint);
        fetchReport(mint);
      }
    }
  }, [router.isReady, router.query.mint]);

  // This handles the new search bar on this page
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchReport(mintAddress);
  };

  return (
    <>
      <Head>
        <title>Token Analyzer | {mintAddress || 'Dashboard'}</title>
      </Head>
      
      <div className={`flex flex-col items-center min-h-full text-white p-4 md:p-8 ${inter.className}`}>
        <main className="w-full max-w-7xl">
          {/* New search bar for this page */}
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-8 max-w-2xl mx-auto">
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
              className="px-6 py-3 font-semibold bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Checking...' : 'Check'}
            </button>
          </form>

          {/* --- RESULTS AREA --- */}
          <div className="mt-8">
            <AnimatePresence>
              {error && <ErrorMessage message={error} />}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-center items-center p-12"
                >
                  <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
              )}
              {report && (
                <ReportCard 
                  report={report} 
                  mintAddress={mintAddress}
                />
              )}
              {!isLoading && !error && !report && !router.query.mint && (
                <InfoBox />
              )}
            </AnimatePresence>
          </div>
          
          <Disclaimer />
        </main>
      </div>
    </>
  );
}