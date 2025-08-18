import { useQuery } from "@tanstack/react-query"
// @ts-expect-error working fine
import { useAccount } from "wagmi"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_PAYMENT_DETAILS_BY_PAYER, GET_TOTAL_PAYMENTS_BY_PAYER_AGGR } from "@/lib/graphql/queries"

type Totals = {
    count: number
    sum: {
        amount: string
    } | null
}

type PaymentExecutedResponse = {
    RecurringPayment_PaymentExecuted: {
        amount: string
        timestamp: string | number
        payer: string
        recipient: string
    }[]
}

export const usePaymentTotals = () => {
    const { address } = useAccount()

    return useQuery<Totals>({
        queryKey: ["paymentTotals", address],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        queryFn: async () => {
            const res = await graphqlClient.request<PaymentExecutedResponse>(GET_PAYMENT_DETAILS_BY_PAYER, {
                payer: address,
            })

            const payments = res?.RecurringPayment_PaymentExecuted ?? []
            const count = payments.length
            const sum = payments.reduce((acc, p) => acc + BigInt(p.amount), BigInt(0)).toString()

            //simulate delay for testing
            //await new Promise((resolve) => setTimeout(resolve, 3000))

            // *************** AGGREGATE QUERIES ***************

            // cannot be used with the free Envio developer plan, however, they can be used on a local deployment with Hasura

            // const res = await graphqlClient.request(GET_TOTAL_PAYMENTS_BY_PAYER_AGGR, {
            //     payer: address,
            // })

            // const sum = res?.RecurringPayment_PaymentExecuted_aggregate?.aggregate.sum
            // const count = res?.RecurringPayment_PaymentExecuted_aggregate?.aggregate.count

            return {
                sum: { amount: sum },
                count,
            }
        },
    })
}
