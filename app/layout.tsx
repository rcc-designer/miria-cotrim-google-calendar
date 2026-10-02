import type { Metadata } from "next";
import "./globals.css";
import {siteContent} from "./siteContent";

export const metadata: Metadata = {
  title: siteContent.seo.title,
  description: siteContent.seo.description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
