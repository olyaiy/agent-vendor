
import { ThemeProvider } from "@/components/theme-provider" 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="en" suppressHydrationWarning>


      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
            <SidebarProvider>
              <AppSidebar />


    
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >

      <Header />

      <SidebarInset className="overflow-hidden">



        {children}
        </SidebarInset>
        </ThemeProvider>
        </SidebarProvider>  
      </body>
      
    </html>
    
  );
}
