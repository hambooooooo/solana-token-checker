// path: components/WatchlistButton.tsx
// --- MODIFIED FILE ---

import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';

// --- FIX: Define FetchError and fetcher locally ---
export class FetchError extends Error {
  info: any;
  status: number;

  constructor(message: string, status: number, info: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    let info;
    try {
      info = await res.json();
    } catch (e) {
      info = 'No JSON error response';
    }

    const error = new FetchError(
      'An error occurred while fetching the data.',
      res.status,
      info
    );
    throw error;
  }

  return res.json();
};
// --- END OF FIX ---


export default function WatchlistButton({ mintAddress }: { mintAddress: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

    mutate('/api/watchlist', newWatchlist, false);

    try {
      await fetch('/api/watchlist', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mintAddress }),
      });

      mutate('/api/watchlist');
    } catch (e) {
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