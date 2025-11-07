import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    // 2. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // 3. Create the new user record in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0], // Use name if provided, otherwise part of email
        passwordHash: hashedPassword,
        // The rest of the fields (watchlist, etc.) will use their defaults
      },
    });

    // 4. Success response
    return res.status(201).json({ 
      message: 'User created successfully.', 
      userId: newUser.id 
    });

  } catch (error) {
    console.error('Sign Up Error:', error);
    return res.status(500).json({ message: 'An internal error occurred during sign up.' });
  }
}