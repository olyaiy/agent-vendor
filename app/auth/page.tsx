'use client'; // Required for client-side interactions like onClick

import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; // Import the new button component
import { SplashCursor } from '@/components/ui/splash-cursor';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthPage() {
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
        className="relative z-10 rounded-3xl bg-gradient-to-br from-white/8 via-white/5 to-white/2 backdrop-blur-md shadow-2xl border border-white/10 w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Glass reflection effect */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent"></div>
        
        {/* Light effect at the top */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl"></div>
        
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
            Sign in to store your chat history and access AI agents for your tasks
          </motion.p>
        </div>

        {/* Sign-in section */}
        <div className="p-8 pt-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <GoogleSignInButton className="w-full mb-6" />
          </motion.div>
          
          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="relative flex items-center justify-center my-4"
          >
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-transparent px-3 text-xs text-white/40">OR</span>
            <div className="border-t border-white/10 w-full"></div>
          </motion.div>
          
          {/* Coming soon section */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-2 p-3 rounded-xl bg-white/5 border border-white/5 text-center"
          >
            <p className="text-white/60 text-xs">
              More sign-in options coming soon
            </p>
          </motion.div>
          
          {/* Terms and privacy */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
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
      </motion.div>
    </div>
  );
}