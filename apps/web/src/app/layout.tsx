import type { Metadata, Viewport } from 'next';
import './globals.css';

import { Navbar } from '@/components/navbar';
import { WalletProvider } from "@/components/wallet-provider"
import { CapacitorInit } from '@/components/capacitor-init';

export const metadata: Metadata = {
  title: 'Colourtura - Color Match Game',
  description: 'Test your reflexes with Color Match on Celo blockchain',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Colourtura',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {/* Initialize Capacitor native features */}
        <CapacitorInit />

        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col bg-gray-50">
          <WalletProvider>
            <Navbar />
            {children}
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
