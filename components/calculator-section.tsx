'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface CalculatorSectionProps {
  toolInvocation: ToolInvocation;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

const CalculatorSection = ({ toolInvocation }: CalculatorSectionProps) => {
  const { state, args } = toolInvocation;
  const expression = args?.expression as string || '';
  
  // Generate a unique key for animation transitions
  const layoutKey = React.useMemo(() => `calc-${Math.random().toString(36).substring(2, 9)}`, []);

  if (state === 'call') {
    return (
      <motion.div 
        className="flex items-center gap-3 p-2 my-1 rounded-lg border border-border/50 bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <Badge variant="outline" className="bg-primary/5 text-primary/80">
          <Calculator className="h-3 w-3 mr-1.5" />
          Calculator
        </Badge>

        <div className="flex items-center gap-2 text-sm">
          <code className="font-mono text-xs bg-background/50 px-2 py-0.5 rounded border border-border/30">
            {expression}
          </code>
          <div className="flex items-center">
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin mr-1.5" />
            <span className="text-xs text-muted-foreground">Calculating...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (state === 'result') {
    const result = toolInvocation.result?.result;
    
    return (
      <motion.div 
        className="flex items-center gap-3 p-2 my-1 rounded-lg border border-border/50 bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <Badge variant="outline" className="bg-primary/5 text-primary/80">
          <Calculator className="h-3 w-3 mr-1.5" />
          Calculator
        </Badge>

        <div className="flex flex-1 items-center gap-1.5">
          <code className="font-mono text-xs bg-background/50 px-2 py-0.5 rounded border border-border/30">
            {expression}
          </code>
          <span className="text-sm text-muted-foreground">=</span>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-1"
          >
            <code className="font-mono text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
              {result}
            </code>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Fallback for unexpected states
  return null;
};

export default CalculatorSection; 