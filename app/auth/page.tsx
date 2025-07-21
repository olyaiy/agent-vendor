'use client'; // Required for client-side interactions like onClick

import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { SplashCursor } from '@/components/ui/splash-cursor';
import { ErrorAlert } from '@/components/ui/error-alert';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'unable_to_create_user':
        return {
          title: 'Account Error',
          message: "We couldn't create your account. Please try again."
        };
      default:
        return null;
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-b from-black to-gray-900/95">
      {/* Enhanced glow effects */}
      <div className="absolute top-1/4 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      {/* SplashCursor in the background */}
      <div className="absolute inset-0 z-0">
        <SplashCursor />
      </div>

      {/* Auth card with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 rounded-3xl bg-gradient-to-br from-white/8 via-white/5 to-white/2 backdrop-blur-md shadow-2xl border border-white/10 w-full max-w-md lg:max-w-4xl mx-4 overflow-hidden"
      >
        {/* Glass reflection effect */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent"></div>
        
        {/* Light effect at the top */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl"></div>
        
        {/* Mobile Layout - Single Column */}
        <div className="lg:hidden">
          {/* Logo placeholder */}
          <div className="flex flex-col items-center pt-12 pb-6">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 0.2,
                type: "spring", 
                stiffness: 100 
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg mb-5"
            >
              <span className="text-2xl font-bold text-white">AV</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl font-bold text-white tracking-tight"
            >
              Agent Vendor
            </motion.h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "4rem" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mt-4 mb-2"
            ></motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-white/70 text-center text-sm max-w-xs px-6"
            >
              Sign in with Google to get started.
            </motion.p>
          </div>

          {/* Sign-in + Waitlist section */}
          <div className="p-8 pt-4 space-y-6">
            {/* Error Alert */}
            {errorInfo && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ErrorAlert
                  title={errorInfo.title}
                  message={errorInfo.message}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GoogleSignInButton />
            </motion.div>

            {/* Terms and privacy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-white/50 text-xs">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Desktop Layout - Two Columns */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:p-8">
          {/* Left Column - Header */}
          <div className="flex flex-col justify-center items-center text-center">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 0.2,
                type: "spring", 
                stiffness: 100 
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg mb-6"
            >
              <span className="text-3xl font-bold text-white">AV</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl font-bold text-white tracking-tight mb-4"
            >
              Agent Vendor
            </motion.h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "5rem" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6"
            ></motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-white/70 text-center text-base max-w-sm leading-relaxed"
            >
              Sign in with Google to get started.
            </motion.p>
          </div>

          {/* Right Column - Forms */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Error Alert */}
            {errorInfo && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ErrorAlert
                  title={errorInfo.title}
                  message={errorInfo.message}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GoogleSignInButton />
            </motion.div>

            {/* Terms and privacy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center"
            >
              <p className="text-white/50 text-xs">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}