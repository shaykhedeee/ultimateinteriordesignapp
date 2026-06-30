import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'StudioOS for Interiors',
  description: 'Geometry-first interior design operating system scaffold',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
