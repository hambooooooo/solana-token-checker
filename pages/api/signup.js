// path: pages/api/signup.js
// --- MODIFIED FILE ---

import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';

// Force NodeJS runtime for bcrypt and prisma
export const runtime = 'nodejs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // FIX: Corrected typo }T to };
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Signup API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}