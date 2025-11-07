// path: pages/analyzer.tsx
// --- MODIFIED FILE ---

import { useSession } from 'next-auth/react';
import WatchlistButton from '@/components/WatchlistButton'; // Import the new component

export default function AnalyzerPage() {
  const { data: session } = useSession();
  
  // Placeholder: Assume the page is analyzing this specific mint address
  const currentMintAddress = "SOL11111111111111111111111111111111111111112";

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Token Analyzer</h1>
      <p>Analyzing token: <code>{currentMintAddress}</code></p>
      
      <div>
        {/* Conditionally render the button only if signed in */}
        {session ? (
          <WatchlistButton mintAddress={currentMintAddress} />
        ) : (
          <p>Sign in to add this token to your watchlist.</p>
        )}
      </div>

      <hr style={{ margin: '2rem 0' }}/>

      {/* Another example token for testing */}
      <h2>Example: Another Token</h2>
      <p>Analyzing token: <code>EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyBtyjH</code></p>
      <div>
        {session ? (
          <WatchlistButton mintAddress={"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyBtyjH"} />
        ) : (
          <p>Sign in to add this token to your watchlist.</p>
        )}
      </div>
    </div>
  );
}