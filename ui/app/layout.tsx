import type React from "react"
import "./globals.css"
import type { Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"

import PrivyProviders from "@/lib/web3/privyProviders"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
})

export const viewport: Viewport = {
    maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} app-background min-h-screen flex flex-col `}>
                <PrivyProviders>
                    <Header />
                    <main className="flex-1 app-background">{children}</main>
                    <Footer />
                    <Toaster position="top-right" richColors expand />
                </PrivyProviders>
            </body>
        </html>
    )
}
