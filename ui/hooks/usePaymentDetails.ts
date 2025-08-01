import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_PAYMENT_DETAILS_BY_PAYER, GET_PAYMENT_DETAILS_BY_RECIPIENT } from "@/lib/graphql/queries"

type PaymentDetails = {
    plan: string
    amount: string
    recipientOrPayer: string
    timestamp: number
    title: string
}

export const usePaymentDetails = (displayPayer: bool) => {
    const { address } = useAccount()

    return useQuery<PaymentDetails[]>({
        queryKey: ["paymentDetails", address, displayPayer],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        keepPreviousData: true,
        queryFn: async () => {
            if (!address) return []

            try {
                const response = displayPayer
                    ? await graphqlClient.request(GET_PAYMENT_DETAILS_BY_RECIPIENT, { recipient: address })
                    : await graphqlClient.request(GET_PAYMENT_DETAILS_BY_PAYER, { payer: address })

                const payments = response?.RecurringPayment_PaymentExecuted ?? []

                //await new Promise((resolve) => setTimeout(resolve, 3000))

                const normalizedPayments = (Array.isArray(payments) ? payments : []).map((item) => {
                    const { recipient, payer, ...rest } = item
                    return {
                        ...rest,
                        recipientOrPayer: displayPayer ? payer : recipient,
                    }
                })

                return normalizedPayments
            } catch (error) {
                console.error("Error fetching payment details:", error)
                return []
            }
        },
    })
}
