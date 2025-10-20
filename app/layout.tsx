import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
export const metadata: Metadata = {
  title: "Mèo Bypass",
  description: "A fast and reliable way to bypass Vietnamese shortlinks.",
  keywords: [
    "bypass links",
    "linkvertise",
    "adfly",
    "shortlinks",
    "bypass link4m",
    "bypass link2m",
    "bypass delta",
    "vietnam",
  ],
  alternates: {
    canonical: "https://meobypass.click/",
  },
  openGraph: {
    title: "Mèo Bypass",
    description: "A fast and reliable way to bypass Vietnamese shortlinks.",
    url: "https://meobypass.click/",
    siteName: "Mèo Bypass",
    images: [
      {
        url: "https://raw.githubusercontent.com/longndev/Meo-Bypass/refs/heads/main/meobypass_banner.jpg",
        width: 1200,
        height: 630,
        alt: "Mèo Bypass Banner",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@twitter_handle",
    title: "Mèo Bypass",
    description: "A fast and reliable way to bypass Vietnamese shortlinks.",
    images: [
      "https://raw.githubusercontent.com/longndev/Meo-Bypass/refs/heads/main/meobypass_banner.jpg",
    ],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#76CF8D" },
    { media: "(prefers-color-scheme: dark)", color: "#76CF8D" },
  ],
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
