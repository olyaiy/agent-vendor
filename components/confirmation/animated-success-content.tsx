'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AnimatedSuccessContentProps {
  checkoutId: string;
  totalAmountPaid: number | null | undefined;
  feeCents: number;
  creditsAddedCents: number;
  currency: string;
  customerEmail: string;
}

// Helper function to format cents to currency string
function formatCentsToCurrency(cents: number | null | undefined, currencyCode: string = 'USD'): string {
  if (cents === null || cents === undefined) {
    return 'N/A';
  }
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export default function AnimatedSuccessContent({
  checkoutId,
  totalAmountPaid,
  feeCents,
  creditsAddedCents,
  currency,
  customerEmail,
}: AnimatedSuccessContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formattedCreditsAdded = formatCentsToCurrency(creditsAddedCents, currency);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
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

  const iconVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.1
      } 
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="w-full max-w-2xl mx-auto space-y-3"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-card rounded-lg shadow-lg p-8 border border-border/50 relative"
            variants={itemVariants}
          >
            <motion.div 
              className="absolute -top-4 -left-4"
              variants={iconVariants}
            >
              <div className="rounded-full bg-white dark:bg-background shadow-md p-2 border border-green-200 dark:border-green-900">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-xl font-semibold mb-6 mt-2"
              variants={itemVariants}
            >
              Transaction Summary
            </motion.h2>
            
            <div className="space-y-6">
              <motion.div 
                className="rounded-lg bg-muted/30 p-6 border border-border/50"
                variants={itemVariants}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold">{formatCentsToCurrency(totalAmountPaid, currency)}</span>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Processing Fee:</span>
                  <span className="font-semibold">{formatCentsToCurrency(feeCents, currency)}</span>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Credits Added:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formattedCreditsAdded}</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-border/50"
                variants={itemVariants}
              >
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  A confirmation receipt has been sent to <span className="font-medium">{customerEmail}</span>
                </p>
              </motion.div>
            </div>
          
            {/* Buttons */}
            <motion.div 
              className="flex flex-col md:flex-row gap-4 w-full mt-8"
              variants={itemVariants}
            >
              <Button asChild size="lg" className="flex-1 bg-green-600 hover:bg-green-700 text-white h-14">
                <Link href="/credits" className="flex items-center justify-center gap-2">
                  View Credits Balance
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1 h-14">
                <Link href="/" className="flex items-center justify-center gap-2">
                  Continue Shopping
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Transaction ID */}
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <p className="text-xs text-muted-foreground">
              Transaction ID: <span className="font-mono">{checkoutId}</span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 