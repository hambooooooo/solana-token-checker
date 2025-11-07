import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletBalance } from './WalletBalance';
import Link from 'next/link'; // Import the Next.js Link

export const Header = () => {
  return (
    <header className="w-full p-4 flex justify-between items-center bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
          {/* Simple Logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Solana Token Analyzer
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/analyzer" className="text-gray-300 hover:text-white transition-colors">
            Analyzer
          </Link>
          <Link href="/#faq" className="text-gray-300 hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>
      </div>
      
      {/* Wallet Buttons */}
      <div className="flex items-center gap-3">
        <WalletBalance />
        <WalletMultiButton />
      </div>
    </header>
  );
};