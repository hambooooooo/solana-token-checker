// path: pages/auth/signin.js
import { getProviders, signIn, getCsrfToken } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function SignIn({ providers, csrfToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push(router.query.callbackUrl || '/');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>Sign In</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsSubmit}>
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Sign in with Email
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />

      {/* OAuth Providers */}
      {Object.values(providers).map((provider) => {
        if (provider.id === 'credentials') return null; // Don't show credentials provider as a button
        return (
          <div key={provider.name}>
            <button
              onClick={() => signIn(provider.id, { callbackUrl: router.query.callbackUrl || '/' })}
              style={{ padding: '10px 20px', width: '100%' }}
            >
              Sign in with {provider.name}
            </button>
          </div>
        );
      })}

      <p style={{ marginTop: '1rem' }}>
        Don&apos;t have an account?{' '}
        <a href="/auth/signup">Sign Up</a>
      </p>
    </div>
  );
}

export async function getServerSideProps(context) {
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: {
      providers,
      csrfToken,
    },
  };
}