import { getProviders, signIn } from "next-auth/react";
import { useRouter } from 'next/router';
import { useState } from 'react';
import Head from 'next/head';

// This function fetches the list of configured providers (Google, Credentials)
// so we can render buttons for them.
export async function getServerSideProps(context) {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}

export default function SignIn({ providers }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  // Handle URL query errors (e.g., from failed login attempts)
  const queryError = router.query.error;

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Call the NextAuth signIn function for the 'credentials' provider
    const result = await signIn('credentials', {
      redirect: false, // Prevent redirecting on failure
      email,
      password,
    });

    if (result.error) {
      // Credentials failure is handled here
      // For security, we give a generic error message
      setError('Invalid email or password.');
    } else {
      // Successful login redirect
      router.push(result.url || '/'); 
    }
  };

  return (
    <>
      <Head>
        <title>Sign In to Token Analyzer</title>
      </Head>
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-3xl font-bold text-center text-white">Sign In</h2>
          
          {/* Display Errors */}
          {(error || queryError) && (
            <div className="p-3 text-sm text-red-100 bg-red-600 rounded-lg">
              {/* Basic sanitation for query errors */}
              {error || queryError.replace(/([a-z])([A-Z])/g, '$1 $2')}
            </div>
          )}

          {/* 1. Credentials Login Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Sign In with Email
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">OR</span>
            </div>
          </div>

          {/* 2. Social Login Buttons */}
          {providers && Object.values(providers).map((provider) => {
            // Only render buttons for OAuth providers (like Google)
            if (provider.type === 'oauth') {
              return (
                <div key={provider.name}>
                  <button
                    onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign in with {provider.name}
                  </button>
                </div>
              );
            }
            return null;
          })}
          
          <div className="text-center text-sm text-gray-400">
            Need an account?{' '}
            <a href="/auth/signup" className="font-medium text-purple-400 hover:text-purple-300">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </>
  );
}