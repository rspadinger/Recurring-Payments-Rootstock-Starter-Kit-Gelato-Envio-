"use client"

// @ts-expect-error working fine
import { useChainId, useSwitchChain } from "wagmi"
import { CONTRACTS, ContractType, ALLOWED_CHAIN_IDS } from "@/constants"

export const getContractAddress = (type: ContractType, chainId: number): `0x${string}` => {
    const contract = CONTRACTS[type]
    const address = contract.addresses?.[chainId]

    if (!address) throw new Error(`Missing address for ${type} on chain ${chainId}`)

    return address
}

export const getContractABI = (type: ContractType) => {
    const contract = CONTRACTS[type]
    if (!contract?.abi) {
        throw new Error(`Missing ABI for contract type: ${type}`)
    }
    return contract.abi.abi
}

export const useEnsureCorrectChain = () => {
    const chainId = useChainId()
    const { switchChainAsync } = useSwitchChain()

    const ensureCorrectChain = async (): Promise<{
        ok: boolean
        error?: string
    }> => {
        if (!ALLOWED_CHAIN_IDS.includes(chainId)) {
            try {
                await switchChainAsync({ chainId: ALLOWED_CHAIN_IDS[1] }) // select testnet
                return { ok: true }
            } catch {
                return { ok: false, error: "Wrong network. Please switch manually." }
            }
        }
        return { ok: true }
    }

    return { ensureCorrectChain, chainId }
}
