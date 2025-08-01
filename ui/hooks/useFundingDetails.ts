import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_FUNDING_DETAILS_BY_PLAN_OWNER } from "@/lib/graphql/queries"

type FundingDetails = {
    plan: string
    payer: string
    amount: string
    timestamp: number | null
    title: string
}

export const useFundingDetails = () => {
    const { address } = useAccount()

    return useQuery<FundingDetails[]>({
        queryKey: ["fundingDetails", address],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        queryFn: async () => {
            if (!address) return []

            try {
                const response = await graphqlClient.request(GET_FUNDING_DETAILS_BY_PLAN_OWNER, {
                    planOwner: address,
                })
                const funds = response?.RecurringPayment_FundsAdded ?? []

                return Array.isArray(funds) ? funds : []
            } catch (error) {
                console.error("Error fetching funding details:", error)
                return []
            }
        },
    })
}
