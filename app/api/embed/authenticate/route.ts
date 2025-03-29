import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { embedTokens } from '@/lib/db/schema/transactions';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: Request) {
  try {
    const { tokenId, domain, agentId } = await request.json();
    
    if (!tokenId || !domain || !agentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate token exists and is active
    const token = await db.select().from(embedTokens)
      .where(and(
        eq(embedTokens.id, tokenId),
        eq(embedTokens.active, true)
      ))
      .limit(1)
      .then(results => results[0]);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if token is expired
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }
    
    // Check if domain is allowed
    if (token.allowedDomains && token.allowedDomains.length > 0) {
      const isAllowed = token.allowedDomains.some((allowedDomain: string) => {
        // Handle wildcard domains like *.example.com
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.substring(2);
          return domain.endsWith(baseDomain);
        }
        return domain === allowedDomain;
      });
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not allowed' },
          { status: 403 }
        );
      }
    }
    
    // Create a secure session token
    const sessionId = nanoid();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Create a response with the session data
    const response = NextResponse.json({
      success: true,
      sessionId,
      userId: token.userId,
      agentId,
    });
    
    // Add the session cookie to the response
    response.cookies.set({
      name: 'embed_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Embed authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
