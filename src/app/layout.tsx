import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const farfetchBasis = localFont({
  src: [
    {
      path: "../../public/fonts/FarfetchBasis-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/FarfetchBasis-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-basis",
  display: "swap",
});

const nimbusRoman = localFont({
  src: "../../public/fonts/NimbusRomanD-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-nimbus",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Birge — Собери группу, получи опт",
  description:
    "Premium Kazakhstan group-buying marketplace with KZT group deals, SIM-bound trust, escrow mock, and wholesale price tiers.",
  icons: {
    icon: "/seo/favicon.svg",
    shortcut: "/seo/favicon.svg",
    apple: [
      { url: "/seo/apple-touch-icon-180x180.png", sizes: "180x180" },
      { url: "/seo/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/seo/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/seo/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/seo/apple-touch-icon-60x60.png", sizes: "60x60" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru-KZ"
      className={`${farfetchBasis.variable} ${nimbusRoman.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-[15px] leading-5 text-foreground bg-background">
        {children}
      </body>
    </html>
  );
}
