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

  let isOnRestrictedAgentPage = false;
  if (isMobile) {
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments[0] === 'agent') {
      if (pathSegments.length === 2 && pathSegments[1] !== 'create') {
        isOnRestrictedAgentPage = true;
      } else if (pathSegments.length === 3) {
        isOnRestrictedAgentPage = true;
      }
    }
  }

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
    isMobile && !isOnRestrictedAgentPage ? (
      <motion.nav 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-0 left-0 w-full z-20 bg-background/90 backdrop-blur-md border-t border-border flex justify-around items-center h-16 px-2 pb-safe"
      >
        <NavItem 
          href="/" 
          icon={<Home size={20} strokeWidth={2} />} 
          isActive={pathname === '/'} 
          label="Home"
        />
        <NavItem 
          href={"/history"}
          icon={<MessageSquare size={20} strokeWidth={2} />}
          isActive={pathname.includes('/history')}
          label="History"
        />
        <NavItem 
          href="/agent/create" 
          icon={<PlusCircle size={20} strokeWidth={2} />} 
          isActive={pathname === '/agent/create'} 
          label="Create"
        />
        <NavItem 
          href="/account" 
          icon={<Settings size={20} strokeWidth={2} />} 
          isActive={pathname === '/account'} 
          label="Settings"
        />
      </motion.nav>
    ) : null
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  label: string;
}

function NavItem({ href, icon, isActive, onClick, label }: NavItemProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center py-2 px-3"
    >
      <motion.div 
        whileTap={{ scale: 0.9 }}
        whileHover={{ y: -1 }}
        className={cn(
          "flex items-center justify-center transition-all duration-200",
          isActive 
            ? "text-primary" 
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </motion.div>
      <span className={cn(
        "text-[10px] mt-1 transition-colors duration-200",
        isActive ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {label}
      </span>
      {isActive && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute top-0 h-0.5 w-full bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
}