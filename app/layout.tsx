import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapBackground - Remove Image Background",
  description: "Quickly remove image backgrounds online. No signup needed, completely free.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
