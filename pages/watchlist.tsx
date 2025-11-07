// path: pages/watchlist.tsx
// --- MODIFIED FILE ---

import type { GetServerSideProps, NextPage } from 'next';
import useSWR from 'swr';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
// FIX: Import the new shared fetcher and error type
import fetcher, { FetchError } from '@/lib/fetcher';

const WatchlistPage: NextPage = () => {
  const {
    data: watchlist,
    error,
    isLoading,
  } = useSWR<string[], FetchError>('/api/watchlist', fetcher); // Use the imported fetcher

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Watchlist</h1>
      
      {isLoading && <p>Loading watchlist...</p>}
      
      {/* Now we can safely access error.message */}
      {error && <p style={{ color: 'red' }}>Failed to load watchlist. {error.message}</p>}

      {/* This check is correct and will now work as intended */}
      {watchlist && (
        <>
          {watchlist.length === 0 ? (
            <p>Your watchlist is empty. Add tokens from the Analyzer page.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {watchlist.map((mintAddress) => (
                <li key={mintAddress} style={{ padding: '10px', border: '1px solid #eee', marginBottom: '5px' }}>
                  <code>{mintAddress}</code>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

// This section (getServerSideProps) was correct and remains unchanged.
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/watchlist',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session: JSON.parse(JSON.stringify(session)),
    },
  };
};

export default WatchlistPage;