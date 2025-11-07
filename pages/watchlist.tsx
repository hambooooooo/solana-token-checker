// path: pages/watchlist.tsx
// --- MODIFIED FILE ---

import type { GetServerSideProps, NextPage } from 'next';
import useSWR from 'swr';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';

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


const WatchlistPage: NextPage = () => {
  const {
    data: watchlist,
    error,
    isLoading,
  } = useSWR<string[], FetchError>('/api/watchlist', fetcher); // Use the local fetcher

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Watchlist</h1>
      
      {isLoading && <p>Loading watchlist...</p>}
      
      {error && <p style={{ color: 'red' }}>Failed to load watchlist. {error.message}</p>}

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