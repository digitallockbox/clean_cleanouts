import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ExtendedWebsiteSettingsProvider } from '@/contexts/website-settings-extended';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { DynamicStyles } from '@/components/ui/dynamic-styles';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cleanoutpro.space'),
  title: 'CleanOuts Pro - Professional Cleanout Services',
  description: 'Fast, reliable, and eco-friendly junk removal and moving services',
  keywords: 'junk removal, moving services, cleanouts, professional cleaning, debris removal',
  authors: [{ name: 'CleanOuts Pro' }],
  creator: 'CleanOuts Pro',
  publisher: 'CleanOuts Pro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cleanoutpro.space',
    title: 'CleanOuts Pro - Professional Cleanout Services',
    description: 'Fast, reliable, and eco-friendly junk removal and moving services',
    siteName: 'CleanOuts Pro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CleanOuts Pro - Professional Cleanout Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CleanOuts Pro - Professional Cleanout Services',
    description: 'Fast, reliable, and eco-friendly junk removal and moving services',
    creator: '@cleanoutspro',
    images: ['/og-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://cleanoutpro.space',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ExtendedWebsiteSettingsProvider>
            <DynamicStyles />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  color: 'black',
                  border: '1px solid #e5e7eb',
                },
              }}
            />
          </ExtendedWebsiteSettingsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}