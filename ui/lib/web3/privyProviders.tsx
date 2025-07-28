"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"
import { rootstock, rootstockTestnet } from "viem/chains"

import type { PrivyClientConfig } from "@privy-io/react-auth"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider, createConfig } from "@privy-io/wagmi"
import { ALCHEMY_RPC_RSKTEST, PRIVY_APP_ID_RSKTEST } from "@/constants"

const queryClient = new QueryClient()

export const wagmiConfig = createConfig({
    chains: [rootstockTestnet],
    transports: {
        // [rootstock.id]: http(`${ALCHEMY_RPC_RSKMAIN}`),
        [rootstockTestnet.id]: http(`${ALCHEMY_RPC_RSKTEST}`),
    },
})

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
