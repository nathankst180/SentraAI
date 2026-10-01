import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RAWBANK SentraAI | Direction du Contrôle des Risques & Surveillance Bancaire (DRC)",
  description: "Système Central de Surveillance des Risques et Intelligence Anti-Fraude SentraAI &bull; Rawbank DRC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" content="darkreader-lock" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full flex flex-col bg-[#07101D]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
