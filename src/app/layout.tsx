import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { PracticeProvider } from "./PracticeContext";
import { ApiKeyProvider } from "./ApiKeyContext";
import { GlobalProviders } from "./GlobalProviders";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";

// JetBrains Mono for code
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PyPractice MVP",
  description: "Learn Python through practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Satoshi Variable Font from Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} antialiased min-h-screen bg-background font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ApiKeyProvider>
            <PracticeProvider>
              <GlobalProviders>
                <AppShell>{children}</AppShell>
              </GlobalProviders>
              <Toaster />
            </PracticeProvider>
          </ApiKeyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
