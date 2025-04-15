'use client'; // Required for client-side interactions like onClick

import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; // Import the new button component
import { Logo } from '@/components/logo';
import { SplashCursor } from '@/components/ui/splash-cursor';

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* SplashCursor in the background */}
      <div className="absolute inset-0 z-0">
        <SplashCursor />
      </div>

      {/* Auth card */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-0 rounded-2xl bg-white/20 backdrop-blur-lg shadow-2xl border border-white/20 px-8 py-10 w-full max-w-md mx-4">
        <div className="flex items-center mb-2 gap-24">
          <h1 className="text-2xl font-semibold text-white drop-shadow mb-20">Sign in to</h1>
          <Logo />
        </div>
        <GoogleSignInButton className=" mx-auto " />
      </div>
    </div>
  );
}