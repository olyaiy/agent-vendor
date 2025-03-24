'use client';

import { memo, useEffect, useState } from 'react';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { useSidebar } from '../ui/sidebar';
import { useWindowSize } from 'usehooks-ts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useSession } from 'next-auth/react';
import { PlusCircle, User, HelpCircle, MessageSquare, Info } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { UserNav } from './sidebar-user-nav';

function PureMainHeader() {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide header on chat pages (UUID routes)
  if (pathname && /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i.test(pathname)) {
    return null;
  }

  return (
    <header className={`flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-3 gap-2 z-50 justify-between ${hasScrolled ? 'border-b' : ''}`}>
      <div className="flex items-center gap-2">
        {(!open || (mounted && windowWidth < 768)) && <SidebarToggle />}
        {!open && mounted && <Logo />}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1">
          <Link href="/agents/create">
            <Button variant="ghost" size="sm" className="gap-1">
              <PlusCircle className="size-4 mr-1" />
              Create
            </Button>
          </Link>
          {session?.user && (
            <Link href="/profile/agents">
              <Button variant="ghost" size="sm">
                <User className="size-4 mr-1" />
                My Agents
              </Button>
            </Link>
          )}
          <Link href="/contact">
            <Button variant="ghost" size="sm">
              <MessageSquare className="size-4 mr-1" />
              Support
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="sm">
              <Info className="size-4 mr-1" />
              About
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="ghost" size="sm">
              <HelpCircle className="size-4 mr-1" />
              FAQ
            </Button>
          </Link>
        </div>
        <UserNav variant="header" user={session?.user} />
      </div>
    </header>
  );
}

export const MainHeader = memo(PureMainHeader);
