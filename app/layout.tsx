import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'react-easy-crop/react-easy-crop.css';
import { AuthProvider } from '@/components/AuthProvider';
import Frame from '@/components/Frame';

export const viewport: Viewport = {
  themeColor: '#171717',
};

export const metadata: Metadata = {
  title: 'Vote wars — Pick a side.',
  description: 'The internet decides. VoteWars is your arena.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/favicon-32x32.png?v=2', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png?v=2', type: 'image/png', sizes: '16x16' },
      { url: '/icon.png?v=2', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png?v=2',
    shortcut: '/favicon.ico?v=2',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#171717" />
        <meta name="apple-mobile-web-app-title" content="Vote wars" />
      </head>
      <body>
        <AuthProvider>
          <Frame>{children}</Frame>
        </AuthProvider>
      </body>
    </html>
  );
}
