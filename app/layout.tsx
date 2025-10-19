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
  icons: {
    icon: "https://github.com/longndev/Meo-Bypass/blob/main/meobypass.avif?raw=true",
    apple: "https://github.com/longndev/Meo-Bypass/blob/main/meobypass.avif?raw=true",
  },
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
