import localFont from "next/font/local";

// Geist for the interface and Geist Mono for figures and meta, self-hosted from the `geist`
// package so the CSP's font-src 'self' holds. The mono face only sets small labels, so it
// isn't preloaded: the first paint waits for one font file, not two.
export const geistSans = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

export const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
});
