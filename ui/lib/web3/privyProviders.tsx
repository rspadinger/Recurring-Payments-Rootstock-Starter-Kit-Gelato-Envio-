"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import type { PrivyClientConfig } from "@privy-io/react-auth"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider } from "@privy-io/wagmi"
import { PRIVY_APP_ID_RSKTEST } from "@/constants"
import { wagmiConfig } from "./wagmiConfig"

const queryClient = new QueryClient()

export const privyConfig: PrivyClientConfig = {
    embeddedWallets: {
        createOnLogin: "users-without-wallets",
        requireUserPasswordOnCreate: true,
        showWalletUIs: true,
    },
    loginMethods: ["wallet", "email", "google", "github"], // "sms"
    appearance: {
        showWalletLoginFirst: true,
        theme: "light",
    },
}

export default function PrivyProviders({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            appId={PRIVY_APP_ID_RSKTEST as string}
            config={privyConfig}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}
