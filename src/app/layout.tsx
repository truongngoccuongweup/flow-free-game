import type { Metadata } from 'next';
import { Outfit, Work_Sans, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const heading = Outfit({ subsets: ['latin'], variable: '--font-heading' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });
const mono = Space_Grotesk({ subsets: ['latin'], variable: '--font-mono' });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const title = 'Daily Flow — nối đường, lấp đầy bảng';
const description = 'Puzzle nối đường mỗi ngày. Giải nhanh, giữ chuỗi 🔥, rủ bạn cùng chơi.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Daily Flow',
  openGraph: { title, description, type: 'website', images: ['/og'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og'] },
};

const themeScript = `(function(){try{var k='daily-flow-theme';var s=localStorage.getItem(k);var d=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.dataset.theme=d;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${heading.variable} ${body.variable} ${mono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
