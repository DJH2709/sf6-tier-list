import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SF6 Community Tier List",
  description: "Street Fighter 6 tier lists voted by the community, split by player rank.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
