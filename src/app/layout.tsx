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

const themeScript = `(function(){try{var k='daily-flow-theme';var s=localStorage.getItem(k);var d=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.dataset.theme=d;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${heading.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
