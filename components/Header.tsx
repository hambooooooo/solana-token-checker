import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletBalance } from './WalletBalance';
import Link from 'next/link'; 
import { useSession, signIn, signOut } from 'next-auth/react'; // <-- Import hooks

export const Header = () => {
  const { data: session } = useSession(); // <-- Get session data

  return (
    <header className="w-full p-4 flex justify-between items-center bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
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
          {/* New: Only show Watchlist if logged in */}
          {session && (
            <Link href="/watchlist" className="text-gray-300 hover:text-white transition-colors">
              ⭐ Watchlist
            </Link>
          )}
          <Link href="/#faq" className="text-gray-300 hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>
      </div>
      
      {/* Wallet and Auth Buttons */}
      <div className="flex items-center gap-3">
        {/* Auth Buttons */}
        {session ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">Hi, {session.user?.name?.split(' ')[0]}</span>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signIn('google')} 
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm font-semibold transition-colors"
          >
            Sign In
          </button>
        )}

        <WalletBalance />
        <WalletMultiButton />
      </div>
    </header>
  );
};