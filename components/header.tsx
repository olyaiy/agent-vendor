"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Plus, SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const { state } = useSidebar();

  const buttonVariants = {
    initial: { 
      opacity: 0,
      scale: 0.8,
      x: -8
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      x: 0,
      transition: { 
        duration: 0.2 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      x: -8,
      transition: { 
        duration: 0.15 
      }
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-4 z-10 transition-colors duration-150 rounded-md border border-sidebar flex items-center justify-center p-1",

        state === "collapsed" && "bg-sidebar border-border " // Add background when expanded
      )}
    >
      <div className="size-8 items-center justify-center flex">
        <SidebarTrigger className="cursor-pointer" />
      </div>

      <AnimatePresence>
        {state === "collapsed" && (
          <>
            <motion.div 
              className="size-8 items-center justify-center flex"
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              key="plus-button"
            >
              <button className="rounded-full hover:bg-gray-100">
                <Plus className="h-5 w-5" />
              </button>
            </motion.div>

            <motion.div 
              className="size-8 items-center justify-center flex"
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              key="search-button"
              transition={{ delay: 0.05 }}
            >
              <button className="rounded-full hover:bg-gray-100">
                <SearchIcon className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}