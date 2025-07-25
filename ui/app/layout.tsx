import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import PrivyProviders from "@/lib/web3/privyProviders"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "StreamPay - Recurring Payments Dapp",
    description: "Schedule automatic recurring payments to any wallet address using RSK",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <PrivyProviders>
                            <Header />
                            <main className="flex-1">{children}</main>
                            <Footer />
                            <Toaster position="top-right" richColors expand />
                        </PrivyProviders>
                    </ThemeProvider>
                </div>
            </body>
        </html>
    )
}
