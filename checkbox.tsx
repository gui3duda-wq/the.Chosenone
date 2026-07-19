import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHOSEN ONE — O Escolhido Não Erra",
  description: "Streetwear motivacional para quem decide o próprio destino. Cada peça é uma declaração. O resto é só barulho.",
  keywords: ["CHOSEN ONE", "streetwear", "camisetas", "moda urbana", "trap", "motivacional"],
  authors: [{ name: "CHOSEN ONE" }],
  openGraph: {
    title: "CHOSEN ONE — O Escolhido Não Erra",
    description: "Streetwear motivacional para quem decide o próprio destino.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
