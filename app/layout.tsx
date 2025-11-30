import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZapDrop - Time-Limited Lightning Drops",
  description: "Create time-limited Lightning drops that return to sender if unclaimed. First one to click wins!",
  openGraph: {
    title: "ZapDrop - Time-Limited Lightning Drops",
    description: "Create time-limited Lightning drops that return to sender if unclaimed. First one to click wins!",
    type: "website",
    siteName: "ZapDrop",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZapDrop - Time-Limited Lightning Drops",
    description: "Create time-limited Lightning drops that return to sender if unclaimed. First one to click wins!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
      >
        <nav className="border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">&#9889;</span>
              <span>ZapDrop</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/gallery"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Gallery
              </Link>
              <a
                href="https://getalby.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Get Alby
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-gray-800 mt-20">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
            <p>Powered by Lightning Network</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
