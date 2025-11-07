// path: pages/api/watchlist.js
// --- NEW FILE ---

import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../lib/prisma';

// Force NodeJS runtime
export const runtime = 'nodejs';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    // --- HANDLE GET REQUEST ---
    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { watchlist: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user.watchlist || []);
    }

    // --- HANDLE POST REQUEST ---
    if (req.method === 'POST') {
      const { mintAddress } = req.body;

      if (!mintAddress) {
        return res.status(400).json({ message: 'Missing mintAddress' });
      }

      // Using Prisma's atomic array push
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          watchlist: {
            push: mintAddress,
          },
        },
        select: { watchlist: true },
      });

      return res.status(200).json(updatedUser.watchlist);
    }

    // --- HANDLE DELETE REQUEST ---
    if (req.method === 'DELETE') {
      const { mintAddress } = req.body;

      if (!mintAddress) {
        return res.status(400).json({ message: 'Missing mintAddress' });
      }

      // To remove, we must fetch the current list, filter, and set
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { watchlist: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const newWatchlist = user.watchlist.filter(
        (item) => item !== mintAddress
      );

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          watchlist: newWatchlist,
        },
        select: { watchlist: true },
      });

      return res.status(200).json(updatedUser.watchlist);
    }

    // --- Handle other methods ---
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Watchlist API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}