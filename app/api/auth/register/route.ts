import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db/repositories/userRepository';
import { registrationLimiter, getIP } from '@/lib/ratelimit';
import { z } from 'zod';

// Schema for registration validation
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = getIP(request);
    const { success, limit, reset, remaining } = await registrationLimiter.limit(ip);
    
    // If rate limit is exceeded, return 429 Too Many Requests
    if (!success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map(error => error.message)
        .join(', ');
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    const { email, password, userName } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create the user
    await createUser(email, password, userName);
    
    return NextResponse.json(
      { success: true, message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 