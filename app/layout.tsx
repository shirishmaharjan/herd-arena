import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herd Arena",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}