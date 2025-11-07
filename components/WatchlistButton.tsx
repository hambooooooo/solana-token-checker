// path: components/WatchlistButton.tsx
// --- MODIFIED FILE ---

import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';
// FIX: Import the new shared fetcher and error type
import fetcher, { FetchError } from '@/lib/fetcher';

export default function WatchlistButton({ mintAddress }: { mintAddress: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // FIX: Use the imported fetcher and provide the custom error type to useSWR
  const { data: watchlist, error } = useSWR<string[], FetchError>('/api/watchlist', fetcher);
  const { mutate } = useSWRConfig();

  if (error) return <div>Failed to load watchlist status</div>;
  if (!watchlist) return <div>Loading...</div>;

  const isInWatchlist = watchlist.includes(mintAddress);

  const handleToggleWatchlist = async () => {
    setIsSubmitting(true);

    const method = isInWatchlist ? 'DELETE' : 'POST';
    const newWatchlist = isInWatchlist
      ? watchlist.filter((item) => item !== mintAddress)
      : [...watchlist, mintAddress];

    // Optimistically update the local cache
    mutate('/api/watchlist', newWatchlist, false);

    try {
      await fetch('/api/watchlist', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mintAddress }),
      });

      // Re-validate to get the source of truth from the server
      mutate('/api/watchlist');
    } catch (e) {
      // Revert optimistic update on error
      mutate('/api/watchlist', watchlist, false);
      console.error('Failed to update watchlist:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleToggleWatchlist}
      disabled={isSubmitting}
      style={{
        padding: '10px 15px',
        cursor: 'pointer',
        background: isInWatchlist ? 'red' : 'green',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
      }}
    >
      {isSubmitting
        ? 'Updating...'
        : isInWatchlist
        ? 'Remove from Watchlist'
        : 'Add to Watchlist'}
    </button>
  );
}