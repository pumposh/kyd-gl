import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { Suspense } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "KYD GL Manager",
  description: "KYD GL Manager",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-12 items-center">
              <nav className="w-full flex justify-center bg-black h-16 sticky top-0 z-50">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm text-white">
                  <div className="flex gap-5 items-center font-semibold">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link 
                            href="/" 
                            className="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
                          >
                            <Image
                              src="/logo.png"
                              alt="KYD Logo"
                              width={70}
                              height={40}
                              className="transition-opacity duration-300"
                              priority
                            />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Home</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-5 items-center">
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
              <div className="flex-grow w-full max-w-5xl flex flex-col gap-10">
                <Suspense fallback={
                  <div className="flex items-center justify-center w-full h-32">
                    <div className="animate-pulse w-full max-w-2xl h-32 bg-muted rounded-lg" />
                  </div>
                }>
                  <AnimatePresence mode="wait">
                    {children}
                  </AnimatePresence>
                </Suspense>
              </div>
              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-10">
                <p>
                  Pumposh Bhat
                  <br />
                  <a href="https://www.pumpo.sh" target="_blank" className="underline opacity-50">www.pumpo.sh</a>
                </p>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
