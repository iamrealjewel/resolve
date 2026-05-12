import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmationProvider } from "@/components/confirm-dialog";
import { LayoutProvider } from "@/components/layout-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Resolve | Enterprise Incident Management",
  description: "A robust, multi-tenant incident management system for modern enterprises.",
};

import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutProvider>
              <ConfirmationProvider>
                <TooltipProvider>
                  {children}
                  <Toaster position="top-right" richColors />
                </TooltipProvider>
              </ConfirmationProvider>
            </LayoutProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
