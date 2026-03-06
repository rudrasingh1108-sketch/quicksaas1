import './globals.css';
import { ReactNode } from 'react';
import localFont from 'next/font/local';
import { ToastProvider } from '../lib/hooks/use-toast';
import { cn } from '../lib/utils';
import { UiPrefsBootstrap } from '../components/layout/ui-prefs-bootstrap';
import { CustomCursor } from '../components/layout/custom-cursor';

const GeistSans = localFont({
  src: '../public/fonts/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const GeistMono = localFont({
  src: '../public/fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
});


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(GeistSans.variable, GeistMono.variable, 'font-sans')}>
        <UiPrefsBootstrap />
        <CustomCursor />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
