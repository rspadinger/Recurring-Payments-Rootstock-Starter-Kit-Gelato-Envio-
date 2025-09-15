"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import type { PrivyClientConfig } from "@privy-io/react-auth"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider } from "@privy-io/wagmi"
import { PRIVY_APP_ID_RSKTEST, ALCHEMY_RPC_RSKTEST } from "@/constants"
import { wagmiConfig } from "./wagmiConfig"
import { addRpcUrlOverrideToChain } from "@privy-io/chains"
import { sepolia, rootstockTestnet, rootstock } from "viem/chains"

const queryClient = new QueryClient()
const rskTestnetOverride = addRpcUrlOverrideToChain(rootstockTestnet, ALCHEMY_RPC_RSKTEST as string)

export const privyConfig: PrivyClientConfig = {
    embeddedWallets: {
        createOnLogin: "users-without-wallets",
        requireUserPasswordOnCreate: true,
        showWalletUIs: true,
    },
    // For now, Privy does not fully support Rootstock for embedded wallet creation - hope, this is coming soon
    loginMethods: ["wallet"], // "email", "google", "github"
    appearance: {
        showWalletLoginFirst: true,
        theme: "light",
    },
    defaultChain: rskTestnetOverride,
    supportedChains: [rskTestnetOverride, sepolia, rootstock],
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
