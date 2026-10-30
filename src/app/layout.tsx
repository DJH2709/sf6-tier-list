import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fighting Game Community Tier Lists",
  description: "Fighting game tier lists voted by the community, split by player rank.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-emerald-500/30">{children}</body>
    </html>
  );
}
