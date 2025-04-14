'use client'; // Required for client-side interactions like onClick

import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; // Import the new button component
export default function AuthPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <GoogleSignInButton />
    </div>
  );
}