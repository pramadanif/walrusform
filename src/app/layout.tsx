import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const syne = Syne({ 
  subsets: ["latin"],
  variable: "--font-syne",
});

const dmMono = DM_Mono({ 
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Walrus Form | Decentralized Feedback",
  description: "Secure, decentralized form builder built on the Walrus Protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jakarta.variable} ${syne.variable} ${dmMono.variable} antialiased selection:bg-[#cdb4ff] selection:text-[#4a2e8c]`}>
        <Providers>
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
