'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Home, RefreshCw } from 'lucide-react';

interface AnimatedErrorContentProps {
  errorTitle: string; // We keep this in interface for consistency, though not used in component
  errorMessage: string;
  checkoutId: string | null;
}

export default function AnimatedErrorContent({
  errorMessage,
  checkoutId
}: Omit<AnimatedErrorContentProps, 'errorTitle'>) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="max-w-xl w-full px-6 py-12 flex flex-col items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="w-full bg-card rounded-lg shadow-lg p-8 mb-8 border border-border/50"
            variants={itemVariants}
          >
            <motion.p 
              className="text-center text-muted-foreground mb-6"
              variants={itemVariants}
            >
              {errorMessage}
              {checkoutId && (
                <span className="font-mono text-sm"> {checkoutId}</span>
              )}
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <Button asChild size="lg" className="flex-1">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Return to Homepage
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1">
                <Link href="/support" className="flex items-center justify-center gap-2">
                  Contact Support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              {checkoutId && (
                <Button 
                  variant="ghost" 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 