import './globals.css';
import { cookies } from 'next/headers';
import { Metadata } from 'next';

import { Toaster } from 'sonner';
import Script from 'next/script';
import { Analytics } from "@vercel/analytics/react"

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { auth } from './(auth)/auth';
import { ThemeProvider } from '@/components/util/theme-provider';
import { Providers } from '@/components/providers';
import { MainHeader } from '@/components/layout/main-header';

export const experimental_ppr = true;

const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export const metadata: Metadata = {
  title: {
    default: 'Agent Vendor - AI Chatbot Marketplace',
    template: '%s | Agent Vendor'
  },
  description: 'Create, customize, and discover AI chatbots with Agent Vendor - the next-generation AI agent development platform',
  keywords: ['AI chatbots', 'AI agents', 'chatbot marketplace', 'custom AI', 'agent development'],
  metadataBase: new URL('https://agentvendor.ca'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://agentvendor.ca',
    title: 'Agent Vendor - AI Chatbot Marketplace',
    description: 'Create, customize, and discover AI chatbots with Agent Vendor - the next-generation AI agent development platform',
    siteName: 'Agent Vendor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Vendor - AI Chatbot Marketplace',
    description: 'Create, customize, and discover AI chatbots with Agent Vendor',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className=" bg-background font-sans">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" richColors />
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <div className="w-full">
                <MainHeader />
                <main>{children}</main>
                <Analytics />
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
