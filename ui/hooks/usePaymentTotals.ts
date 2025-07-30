import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_TOTAL_PAYMENTS_BY_PAYER } from "@/lib/graphql/queries"

type Totals = {
    count: number
    sum: {
        amount: string
    } | null
}

export const usePaymentTotals = () => {
    const { address } = useAccount()

    return useQuery<Totals>({
        queryKey: ["paymentTotals", address],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        queryFn: async () => {
            const res = await graphqlClient.request(GET_TOTAL_PAYMENTS_BY_PAYER, {
                payer: address,
            })
            return res.RecurringPayment_PaymentExecuted_aggregate.aggregate
        },
    })
}
