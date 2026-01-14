import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SentimentAlpha - Review Sentiment Analyzer",
  description: "AI-powered sentiment analysis for customer reviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="app-header">
          <div className="header-container">
            <Link href="/" className="logo">
              <span>✨</span>
              <span>SentimentAlpha</span>
            </Link>
            <nav className="nav">
              <Link href="/">Reviews</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <div className="container">
            <p>
              &copy; {new Date().getFullYear()} SentimentAlpha. Powered by AI
              Sentiment Analysis.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
