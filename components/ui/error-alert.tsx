'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorAlertProps {
  title: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

export function ErrorAlert({ 
  title, 
  message, 
  onClose,
  dismissible = true 
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative mb-6 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-300 mb-1">
            {title}
          </h3>
          <p className="text-sm text-red-200/90 leading-relaxed">
            {message}
          </p>
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-red-500/20 transition-colors"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        )}
      </div>
    </motion.div>
  );
}