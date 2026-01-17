import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotWrapper } from "@/components/ai-chatbot/chatbot-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { MarketingProvider } from "@/context/marketing-context";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cylinder Management Dashboard",
  description: "Operations control center for LPG cylinder logistics.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ErrorBoundary>
          <MarketingProvider>
            {children}
            <ChatbotWrapper />
            <Toaster position="top-right" duration={3000} />
          </MarketingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
