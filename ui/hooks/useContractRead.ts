"use client"

// @ts-expect-error working fine
import { useReadContract } from "wagmi"
import { useState, useEffect } from "react"
import { getContractABI, getContractAddress, useEnsureCorrectChain } from "@/lib/web3/utils"
import { ContractType, ALLOWED_CHAIN_IDS } from "@/constants"

export const useContractRead = ({
    contract,
    functionName,
    args = [] as const,
    enabled = true,
    overrideAddress,
    caller,
    onSuccess,
    onError,
}: {
    contract: ContractType
    functionName: string
    args?: readonly unknown[]
    enabled?: boolean
    overrideAddress?: `0x${string}`
    caller?: `0x${string}`
    onSuccess?: (result: any) => void
    onError?: (error: any) => void
}) => {
    const { ensureCorrectChain, chainId } = useEnsureCorrectChain()
    const [status, setStatus] = useState("")

    const abi = getContractABI(contract)
    const address = overrideAddress ?? getContractAddress(contract, chainId)
    const shouldRun = !!address && enabled

    const result = useReadContract({
        address,
        abi,
        functionName,
        args,
        account: caller,
        query: {
            enabled: shouldRun,
            staleTime: 10_000,
            gcTime: 30_000,
            onSuccess: (data: unknown) => onSuccess?.(data),
            onError: (err: unknown) => onError?.(err),
        },
    })

    // Auto-switch chain if needed
    useEffect(() => {
        if (!ALLOWED_CHAIN_IDS.includes(chainId)) {
            ensureCorrectChain().then((res) => {
                if (!res.ok) setStatus(res.error!)
                else setStatus("")
            })
        }
    }, [chainId, enabled, ensureCorrectChain])

    return {
        data: result.data,
        error: result.error,
        isLoading: result.query?.isFetching ?? false,
        isError: result.query?.isError ?? false,
        isSuccess: result.query?.isSuccess ?? false,
        refetch: result.query?.refetch,
        status,
    }
}

// Usage Example:

// import { useContractRead } from "@/lib/web3/useContractRead"
// import { contractType } from "@/constants"

// export const PlanName = ({ planId }: { planId: number }) => {
//     const { data, isLoading, status, refetch } = useContractRead({
//         contract: contractType.RecurringPaymentFactory,
//         functionName: "getPlan",
//         args: [planId],
//         enabled: true,
//         onSuccess: (data) => console.log("Read success:", data),
//         onError: (err) => console.error("Read failed:", err),
//     })

//     return (
//         <div>
//             {isLoading ? "Loading..." : `Plan ID ${planId}: ${data?.name ?? "Unknown"}`}
//             <button onClick={refetch}>Refresh</button>
//             {status && <p>Status: {status}</p>}
//         </div>
//     )
// }
