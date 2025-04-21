"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  SearchIcon, 
  Home, 
  MessageSquare, 
  PlusCircle, 
  Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const { 
    state, 
    isMobile,
  } = useSidebar();
  
  const pathname = usePathname();

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





  return !isMobile ? (
    <div
      className={cn(
        "fixed top-4 left-4 z-10 transition-colors duration-150 rounded-md border border-sidebar flex items-center justify-center p-1",
        state === "collapsed" && "bg-sidebar border-border "
      )}
    >
      <div className="size-8 items-center justify-center flex">
        <SidebarTrigger className="cursor-pointer  hover:scale-105 transition-all duration-100" />
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
              <button className="rounded-full cursor-pointer  hover:scale-105 transition-all duration-100">
                <Plus className="h-5 w-5 " />
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
              <button className="rounded-full cursor-pointer hover:scale-105 transition-all duration-100">
                <SearchIcon className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <motion.nav 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-0 left-0 w-full z-20 bg-background/80 backdrop-blur-md border-t border-border flex justify-around items-center h-16 px-2"
    >
      <NavItem 
        href="/" 
        icon={<Home size={20} strokeWidth={2} />} 
        isActive={pathname === '/'} 
      />
      <NavItem 
        href={"/history"}
        icon={<MessageSquare size={20} strokeWidth={2} />}
        isActive={pathname.includes('/history')}
      />
      <NavItem 
        href="/agent/create" 
        icon={<PlusCircle size={20} strokeWidth={2} />} 
        isActive={pathname === '/agent/create'} 
      />
      <NavItem 
        href="/account" 
        icon={<Settings size={20} strokeWidth={2} />} 
        isActive={pathname === '/account'} 
      />
    </motion.nav>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function NavItem({ href, icon, isActive, onClick }: NavItemProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center"
    >
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground group-hover:text-foreground group-hover:bg-accent/50"
        )}
      >
        {icon}
      </motion.div>
      {isActive && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute -bottom-3 h-1 w-5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}