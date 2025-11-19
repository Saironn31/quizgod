import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { DocumentProcessingProvider } from "../contexts/DocumentProcessingContext";
import ChatOverlay from '@/components/ChatOverlay';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizGod - Create, Play & Share Quizzes",
  description: "Free quiz platform with AI generation, collaborative classes, and leaderboards",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6371037672090963" />
        
        {/* FastSpring Payment Integration */}
        <script
          id="fsc-api"
          src="https://sbl.onfastspring.com/sbl/1.0.6/fastspring-builder.min.js"
          type="text/javascript"
          data-storefront="quizgod.test.onfastspring.com/popup-quizgod"
          async
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove preload class after page loads to enable animations
              window.addEventListener('load', () => {
                document.body.classList.remove('preload');
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased preload`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <DocumentProcessingProvider>
            <ThemeProvider>
              {children}
              <ChatOverlay />
            </ThemeProvider>
          </DocumentProcessingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
