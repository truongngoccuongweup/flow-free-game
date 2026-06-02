import type { Metadata } from 'next';
import { Outfit, Work_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const heading = Outfit({ subsets: ['latin'], variable: '--font-heading' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });
const mono = Space_Grotesk({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Daily Flow',
  description: 'Nối đường, lấp đầy bảng — puzzle mỗi ngày.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${heading.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
