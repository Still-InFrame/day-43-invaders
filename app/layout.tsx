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
  metadataBase: new URL("https://invaders.100dayaichallenge.com"),
  title: "Bug Invaders",
  description:
    "A neon synthwave Space Invaders — squash the bugs, chase the high score.",
  openGraph: {
    title: "Bug Invaders",
    description:
      "A neon synthwave Space Invaders — squash the bugs, chase the high score.",
    images: ["/hero.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bug Invaders",
    description:
      "A neon synthwave Space Invaders — squash the bugs, chase the high score.",
    images: ["/hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
