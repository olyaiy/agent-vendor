'use client'; // Required for client-side interactions like onClick

import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; // Import the new button component
import { Logo } from '@/components/logo';
import { SplashCursor } from '@/components/ui/splash-cursor';


export default function AuthPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <SplashCursor/>

      <div className="absolute inset-0 flex items-center justify-center gap-4">
      
        <div className="flex items-center gap-2">
        <h1> Sign in to </h1> <Logo />
    
        <GoogleSignInButton className="z-50" />
        </div>
      </div>
    </div>
  );
}