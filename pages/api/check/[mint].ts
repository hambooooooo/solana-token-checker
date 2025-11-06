import type { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey } from '@solana/web3.js';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { getSafetyReport, SafetyReport } from '@/lib/helius';

// Initialize Rate Limiter: 10 requests per 10 seconds from a single IP
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper function to get the user's IP address
const getIP = (req: NextApiRequest) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  return ip;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // --- Wrap EVERYTHING in a try/catch block ---
  try {
    // --- 1. HTTP Method Check ---
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- 2. Rate Limiting ---
    const ip = getIP(req);
    const { success, limit, remaining } = await ratelimit.limit(ip);

    // Send rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (!success) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // --- 3. Input Sanitization ---
    const { mint } = req.query;

    if (typeof mint !== 'string') {
      return res.status(400).json({ error: 'Invalid mint address format' });
    }

    let validMintAddress: string;
    try {
      // This validates that the string is a valid Solana public key
      validMintAddress = new PublicKey(mint).toBase58();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid mint address' });
    }

    const cacheKey = `report:${validMintAddress}`;

    // --- 4. Caching (Check) ---
    const cachedReport = await kv.get<SafetyReport>(cacheKey);

    if (cachedReport) {
      console.log(`[CACHE] HIT for ${validMintAddress}`);
      return res.status(200).json(cachedReport);
    }

    console.log(`[CACHE] MISS for ${validMintAddress}`);

    // --- 5. Data Fetching ---
    console.log(`[FETCH] Calling Helius for ${validMintAddress}...`);
    
    const report: SafetyReport = await getSafetyReport(validMintAddress);

    // --- 6. Caching (Set) ---
    // Cache the new report for 60 seconds (as per the brief)
    await kv.set(cacheKey, report, { ex: 60 });

    // --- 7. Respond ---
    return res.status(200).json(report);

  } catch (error: any) {
    // --- This is now the global error catcher ---
    // This will catch errors from ratelimit, Helius, etc.
    console.error(`Unhandled error:`, error.message);
    return res.status(500).json({ error: 'Internal Server Error. Check server logs.' });
  }
}