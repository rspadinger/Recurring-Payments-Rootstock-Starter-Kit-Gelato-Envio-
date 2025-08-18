"use client"

import { useState } from "react"
// @ts-expect-error working fine
import { useWriteContract } from "wagmi"
import { ContractType, ALLOWED_CHAIN_IDS } from "@/constants"
import { getContractABI, getContractAddress, useEnsureCorrectChain } from "@/lib/web3/utils"
import { parseGwei } from "viem"

export const useContractWrite = () => {
    const { writeContractAsync } = useWriteContract()
    const { ensureCorrectChain, chainId } = useEnsureCorrectChain()

    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<string>("")
    const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

    const executeWrite = async ({
        contract,
        functionName,
        args = [] as const,
        value,
        overrideAddress,
        onSuccess,
        onError,
    }: {
        contract: ContractType
        functionName: string
        args?: readonly unknown[]
        value?: bigint
        overrideAddress?: `0x${string}`
        onSuccess?: (result: unknown) => void
        onError?: (error: unknown) => void
    }): Promise<{ result: any; status: string }> => {
        setIsLoading(true)
        setStatus("")
        setTxHash(null)

        // Ensure correct chain
        if (!ALLOWED_CHAIN_IDS.includes(chainId)) {
            const res = await ensureCorrectChain()
            if (!res.ok) {
                setStatus(res.error!)
                setIsLoading(false)
                return { result: null, status: res.error! }
            }
        }

        const address = overrideAddress ?? getContractAddress(contract, chainId)

        if (!address) {
            const msg = "Contract address could not be determined."
            setStatus(msg)
            setIsLoading(false)
            return { result: null, status: msg }
        }

        try {
            const result = await writeContractAsync({
                address,
                abi: getContractABI(contract),
                functionName,
                args,
                value: value ?? 0n,
            })

            setTxHash(result)
            setIsLoading(false)
            setStatus("success")
            onSuccess?.(result)

            return { result, status: "success" }
        } catch (err: any) {
            const message = err?.message || "An unknown error occurred during write"
            const isUserDenied = message.includes("User denied")
            const errorStatus = isUserDenied ? "User denied the transaction." : message

            setStatus(errorStatus)
            setIsLoading(false)
            onError?.(err)

            return {
                result: null,
                status: errorStatus,
            }
        }
    }

    return {
        executeWrite,
        isLoading,
        status,
        txHash,
    }
}

// Usage Example:

// const {
//   executeWrite,
//   isLoading,
//   status,
//   txHash,
// } = useContractWrite()

// const handleCreatePlan = async () => {
//   const { result } = await executeWrite({
//     contract: contractType.RecurringPaymentFactory,
//     functionName: "createPlan",
//     args: [...],
//     value: 0n,
//     onSuccess: (txHash) => toast.success("Transaction sent!"),
//     onError: (err) => toast.error(err.message),
//   })
// }
