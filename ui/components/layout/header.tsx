"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, Package, Home, Gift } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
// @ts-expect-error working fine
import { useAccount, useDisconnect, useBalance } from "wagmi"

export default function Header() {
    // Hooks
    const { user, ready, authenticated, login, logout } = usePrivy()
    const { address } = useAccount()
    const { disconnect } = useDisconnect()

    return (
        <header>
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center">
                    <div className="hover-logo">
                        <span className="logo-text">
                            <span className="text-cyan-500 font-extrabold pr-0 ">Smart</span>
                            <span className="text-neutral-700 hover:text-neutral-900 font-extrabold">
                                Will
                            </span>
                        </span>
                    </div>
                </Link>

                <nav className="hidden md:flex space-x-6 mx-4">
                    <Link href="/" className="text-slate-600 hover:text-cyan-600 transition-colors">
                        <span className="flex items-center">
                            <Home className="mr-1 h-4 w-4" />
                            Home
                        </span>
                    </Link>

                    {ready && user && (
                        <Link href="/heir" className="text-slate-600 hover:text-cyan-600 transition-colors">
                            <span className="flex items-center">
                                <Gift className="mr-1 h-4 w-4" />
                                My Inheritance
                            </span>
                        </Link>
                    )}
                </nav>

                <div className="flex items-center space-x-3">
                    <Button
                        disabled={!ready}
                        onClick={() => {
                            if (!authenticated && !address) login()
                            else if (authenticated && !address) logout()
                            else if (authenticated && address) logout()
                            else if (!authenticated && address) disconnect()
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                        <span className="flex items-center">
                            <Wallet className="mr-2 h-4 w-4" />
                            {!authenticated && !address && "Connect Wallet"}
                            {authenticated && !address && "Logout"}
                            {authenticated &&
                                address &&
                                `Logout ${address.substring(0, 6)}...${address.substring(
                                    address.length - 4
                                )}`}
                            {!authenticated &&
                                address &&
                                `Disconnect ${address.substring(0, 6)}...${address.substring(
                                    address.length - 4
                                )}`}
                        </span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
