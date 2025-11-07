// path: components/Header.tsx
// --- MODIFIED FILE ---

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', alignItems: 'center' }}>
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, gap: '1.5rem' }}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/analyzer">Analyzer</Link>
          </li>
          
          {/* Conditionally render the Watchlist link */}
          {session && (
            <li>
              <Link href="/watchlist">
                <strong>Watchlist</strong>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {session ? (
          <>
            <span style={{ fontSize: '0.9rem' }}>{session.user.email}</span>
            <button 
              onClick={() => signOut()} 
              style={{ padding: '8px 12px', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <button 
            onClick={() => signIn()} 
            style={{ padding: '8px 12px', cursor: 'pointer' }}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}