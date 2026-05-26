import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Herd Arena",
  description: "Herd International World Cup 2026 Prediction Challenge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}