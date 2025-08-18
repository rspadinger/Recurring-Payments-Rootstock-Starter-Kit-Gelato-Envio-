import { useQuery } from "@tanstack/react-query"
// @ts-expect-error working fine
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

type PaymentByPayerResponse = {
    RecurringPayment_PaymentExecuted: Array<{
        plan: string
        amount: string
        payer: string
        recipient: string
        timestamp: number
        title: string
    }>
}

type PaymentByRecipientResponse = {
    RecurringPayment_PaymentExecuted: Array<{
        plan: string
        amount: string
        payer: string
        recipient: string
        timestamp: number
        title: string
    }>
}

export const usePaymentDetails = (displayPayer: boolean) => {
    const { address } = useAccount()

    return useQuery<PaymentDetails[]>({
        queryKey: ["paymentDetails", address, displayPayer],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        queryFn: async (): Promise<PaymentDetails[]> => {
            if (!address) return []

            try {
                const response: PaymentByPayerResponse | PaymentByRecipientResponse = displayPayer
                    ? await graphqlClient.request<PaymentByRecipientResponse>(GET_PAYMENT_DETAILS_BY_RECIPIENT, {
                          recipient: address,
                      })
                    : await graphqlClient.request<PaymentByPayerResponse>(GET_PAYMENT_DETAILS_BY_PAYER, {
                          payer: address,
                      })

                const payments = response.RecurringPayment_PaymentExecuted ?? []

                //await new Promise((resolve) => setTimeout(resolve, 3000))

                const normalizedPayments: PaymentDetails[] = payments.map((item) => {
                    const { recipient, payer, ...rest } = item
                    return {
                        ...rest,
                        recipientOrPayer: displayPayer ? payer : recipient,
                    } as PaymentDetails
                })

                return normalizedPayments
            } catch (error) {
                console.error("Error fetching payment details:", error)
                return []
            }
        },
    })
}
