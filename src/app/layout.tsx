import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pakjesavond Live',
  description: 'Het interactieve Sinterklaas-dobbelspel voor de woonkamer.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#120d2b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
