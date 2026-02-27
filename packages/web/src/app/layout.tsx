import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApiNow — APIs for the Agent Economy',
  description: 'Unified API gateway for AI agents. Discover, integrate, and proxy thousands of APIs with a single key.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
