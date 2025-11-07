// path: pages/watchlist.tsx
// --- NEW FILE ---

import { getSession } from 'next-auth/react';
import type { GetServerSideProps, NextPage } from 'next';
import useSWR from 'swr';

// Simple fetcher function for useSWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const WatchlistPage: NextPage = () => {
  const {
    data: watchlist,
    error,
    isLoading,
  } = useSWR<string[]>('/api/watchlist', fetcher);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Watchlist</h1>
      
      {isLoading && <p>Loading watchlist...</p>}
      
      {error && <p style={{ color: 'red' }}>Failed to load watchlist.</p>}

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

// Protect the page using server-side redirection
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

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
      session, // Pass session as prop
    },
  };
};

export default WatchlistPage;