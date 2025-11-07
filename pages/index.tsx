import { Inter } from 'next/font/google';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router'; // Import the router

const inter = Inter({ subsets: ['latin'] });

// --- (FaqItem and FeatureCard components are unchanged, so they are omitted for brevity) ---
// ... (Your existing FaqItem and FeatureCard components go here) ...
const FaqItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 text-left"
      >
        <span className="text-lg font-semibold text-white">{q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-400">{a}</p>
      </motion.div>
    </div>
  );
};
const FeatureCard = ({ icon, title, text }: { icon: string, title: string, text: string }) => (
  <div className="glowing-card-bg p-6 rounded-lg text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{text}</p>
  </div>
);
// --- (End of unchanged components) ---


// Main Home Page
export default function Home() {
  const [mintAddress, setMintAddress] = useState('');
  const router = useRouter(); // Initialize the router

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mintAddress) {
      // Navigate to the analyzer page with the mint as a query parameter
      router.push(`/analyzer?mint=${mintAddress}`);
    }
  };

  return (
    <div className={`flex flex-col items-center p-4 md:p-8 ${inter.className}`}>
      
      {/* --- Hero Section --- */}
      <section className="flex flex-col items-center text-center max-w-3xl py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="gradient-text">#1 Solana</span>
          <br />
          Token Analyzer
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-lg">
          Instantly get a full safety report, live market data, and holder analysis for any SPL token. No coding needed.
        </p>
        
        {/* Main Search Bar CTA */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <motion.div 
            className="flex flex-col md:flex-row gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
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
              className="px-6 py-3 font-semibold bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              Analyze Now 🚀
            </button>
          </motion.div>
        </form>
      </section>

      {/* --- Features Section --- */}
      <section className="w-full max-w-6xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon="🛡️" 
            title="100% Safe Scan" 
            text="We use Helius RPCs to run real-time checks for mint/freeze authority, liquidity, and holder concentration."
          />
          <FeatureCard 
            icon="⚡" 
            title="Instant Analysis" 
            text="No waiting. Get a full dashboard with live chart data, market cap, and safety score in seconds."
          />
          <FeatureCard 
            icon="📈" 
            title="Reliable Data" 
            text="We pull data directly from Helius and DexScreener, the same sources the top traders use."
          />
        </div>
      </section>

      {/* --- Social Proof Section --- */}
      <section className="w-full max-w-5xl py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 gradient-text">Trusted by Traders Worldwide</h2>
        <p className="text-gray-400 mb-8">Join thousands of users who get instant insights before they invest.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-5xl font-bold text-purple-400">100,000+</div>
            <div className="text-gray-400">Tokens Scanned</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-purple-400">5,000+</div>
            <div className="text-gray-400">Daily Users</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-purple-400">2M+</div>
            <div className="text-gray-400">API Calls Monthly</div>
          </div>
        </div>
      </section>

      {/* --- FAQ Section (with ID for linking) --- */}
      <section id="faq" className="w-full max-w-3xl py-16">
        <h2 className="text-4xl font-bold text-center mb-8 gradient-text">Frequently Asked Questions</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <FaqItem 
            q="How does the safety score work?" 
            a="We run 5 critical checks: Mint Authority, Freeze Authority, Liquidity, Holder Distribution, and Metadata Mutability. Each 'pass' is 20 points, a 'warn' is 10. A high score (80+) is good, but always do your own research (DYOR)."
          />
          <FaqItem 
            q="Is it safe to connect my wallet?" 
            a="Yes. Our site is 100% safe. We use the official Solana wallet adapter. We can only *read* your public wallet address to check your SOL balance. We can NEVER move your funds or tokens without your manual approval in a wallet pop-up."
          />
          <FaqItem 
            q="Where does the data come from?" 
            a="All data is pulled in real-time from Helius, the #1 RPC provider on Solana, and DexScreener, the #1 platform for live chart data. You are seeing the most accurate data available."
          />
          <FaqItem 
            q="How will you monetize this? (Future)"
            a="We plan to offer a 'Pro' version that includes real-time LP lock/burn checks, a live trade feed, and a portfolio tracker. The core analyzer will always be free."
          />
        </div>
      </section>

    </div>
  );
}