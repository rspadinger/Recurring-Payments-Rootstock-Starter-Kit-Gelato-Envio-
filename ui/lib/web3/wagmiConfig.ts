// lib/web3/wagmiConfig.ts
import { createConfig } from "@privy-io/wagmi"
import { http } from "viem"
import { rootstock, rootstockTestnet } from "viem/chains"
import { ALCHEMY_RPC_RSKTEST } from "@/constants"

export const wagmiConfig = createConfig({
    chains: [rootstockTestnet],
    transports: {
        // [rootstock.id]: http(`${ALCHEMY_RPC_RSKMAIN}`),
        [rootstockTestnet.id]: http(`${ALCHEMY_RPC_RSKTEST}`),
    },
})
