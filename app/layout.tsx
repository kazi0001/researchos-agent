import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "ResearchOS Agent",
  description:
    "Agentic AI platform for research funding search, opportunity analysis, and research planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="fixed right-5 top-5 z-50">
          <ThemeToggle />
        </div>

        {children}
      </body>
    </html>
  );
}