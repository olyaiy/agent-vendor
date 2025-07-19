import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Handle the specific error we're looking for
  if (error === 'unable_to_create_user') {
    // Redirect to our custom auth page with error parameter
    return NextResponse.redirect(
      new URL('/auth?error=unable_to_create_user', request.url)
    );
  }
  
  // For other errors, you could redirect to a general error page
  // or let better-auth handle them normally
  return NextResponse.redirect(
    new URL('/auth?error=auth_error', request.url)
  );
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way
  return GET(request);
}