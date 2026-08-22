import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shri Sanwariya Road Lines (SSRL) ERP',
  description: 'Production-grade Enterprise Logistics & Transport Management ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
