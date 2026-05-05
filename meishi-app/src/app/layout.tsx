import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EVOLX 名刺管理',
  description: '名刺をスキャンして管理するアプリ',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        {/* ヘッダー */}
        <header className="bg-black text-white sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-widest">
              EVOLX
            </a>
            <span className="text-xs text-gray-400 tracking-wider uppercase">
              名刺管理
            </span>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
