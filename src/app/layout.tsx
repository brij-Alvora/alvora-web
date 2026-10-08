import type { Metadata } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alvora",
  description: "AI Builder Identity & Validation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${sourceSerif.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
