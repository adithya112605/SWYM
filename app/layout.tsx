import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Threadline — Everyday, considered",
  description: "A modern apparel storefront with mergeable wishlists.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
