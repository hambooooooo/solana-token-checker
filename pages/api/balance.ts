import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenBalance } from '@/lib/helius'; // Import our new function

type ResponseData = {
  balance: number;
  uiAmount: number;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { wallet, mint } = req.query;

  if (typeof wallet !== 'string' || typeof mint !== 'string') {
    return res.status(400).json({ error: 'Wallet and mint addresses are required.' });
  }

  try {
    const balanceData = await getTokenBalance(wallet, mint);
    res.status(200).json(balanceData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch balance' });
  }
}