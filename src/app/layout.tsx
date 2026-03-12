import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maison — Fashion Operations Platform",
  description:
    "WhatsApp-driven purchase order management for fashion brands. Track production, shipments, and communications in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
