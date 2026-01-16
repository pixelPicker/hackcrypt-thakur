import type { Metadata } from "next";
import "../styles/globals.css";

import { Navbar } from "@/components/Navbar";
import { Providers } from "@/app/providers";
import clsx from "clsx";
import { dmsans } from "@/components/ui/fonts";

export const metadata: Metadata = {
  title: "Deepfake Detection and Media Authenticity Analyzer",
  description: "Forensic-style media authenticity analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={clsx(
          dmsans.className,
          "min-h-dvh bg-background text-foreground antialiased"
        )}
      >
        <Providers>
          
          {children}
        </Providers>
      </body>
    </html>
  );
}
