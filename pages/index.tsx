import { useState } from 'react';
import type { SafetyReport } from '@/lib/helius';

type Report = SafetyReport; 

export default function Home() {
  // --- React State ---
  const [mintAddress, setMintAddress] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Form Submission Logic ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      const response = await fetch(`/api/check/${mintAddress}`);
      
      // --- ROBUST ERROR HANDLING ---
      if (!response.ok) {
        let errorMessage: string;
        try {
          // Try to parse the error JSON we *expect*
          const errData = await response.json();
          errorMessage = errData.error || 'Failed to fetch report.';
        } catch (parseError) {
          // If JSON parsing fails, the server sent non-JSON (like HTML)
          console.error("Failed to parse error response:", parseError);
          // Fallback to the status text
          errorMessage = `Server Error: ${response.status} (${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      // --- END OF ERROR HANDLING ---

      const data: Report = await response.json();
      setReport(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Main Page Render ---
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <main className="w-full max-w-2xl">
        {/* 1. Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          Solana Token Safety Checker
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Check a token for common scam red flags before you trade.
        </p>

        {/* 2. Input Form */}
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

        {/* 3. Results Area */}
        <div className="mt-6">
          {error && <ErrorMessage message={error} />}
          {report && <ReportCard report={report} />}
          {!isLoading && !error && !report && <InfoBox />}
        </div>
        
        {/* 4. Disclaimer */}
        <Disclaimer />
      </main>
    </div>
  );
}

// --- Sub-Components ---

const ReportCard = ({ report }: { report: Report }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
    <div className="px-4 py-4 md:px-6 md:py-5 bg-gray-800">
      <h2 className="text-2xl font-bold">{report.tokenInfo.name} ({report.tokenInfo.symbol})</h2>
    </div>
    <div className="border-t border-gray-700 p-4 md:p-6 space-y-4">
      <ReportItem item={report.mintAuthority} />
      <ReportItem item={report.freezeAuthority} />
      <ReportItem item={report.holderDistribution} />
      <ReportItem item={report.metadata} />
      <ReportItem item={report.liquidity} />
    </div>
  </div>
);

const ReportItem = ({ item }: { item: { status: string; message: string } }) => {
  const { message } = item;
  const icon = message.startsWith('✅') ? '✅' : message.startsWith('⚠️') ? '⚠️' : '❌';
  
  let textColor = 'text-green-400';
  if (icon === '⚠️') textColor = 'text-yellow-4transparency';
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