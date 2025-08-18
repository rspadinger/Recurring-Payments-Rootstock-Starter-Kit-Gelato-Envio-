import { useQuery } from "@tanstack/react-query"
// @ts-expect-error working fine
import { useAccount } from "wagmi"
import { getBalance, readContract } from "@wagmi/core"
import { graphqlClient } from "@/lib/graphql/client"
import {
    GET_PLANS_BY_PAYER,
    GET_PAYMENT_DETAILS_BY_PLAN,
    GET_PAYMENT_DETAILS_BY_PLAN_AGGR,
} from "@/lib/graphql/queries"
import { wagmiConfig } from "@/lib/web3/wagmiConfig"
import { contractType } from "@/constants"
import { getContractABI } from "@/lib/web3/utils"

type PlanDetails = {
    planAddress: string
    balance: string
    status: number
    recipient: string
    numberOfPayments: number
    totalAmountOfPayment: string
    firstPayment: number | null
    lastPayment: number | null
    paymentInterval: number
    paymentAmount: string
    title: string
}

type PlansByPayerResponse = {
    RecurringPaymentFactory_PlanCreated: Array<{
        plan: string
        recipient: string
        title: string
    }>
}

type PaymentExecutedResponse = {
    RecurringPayment_PaymentExecuted: {
        amount: string
        timestamp: string | number
    }[]
}

export const usePaymentPlans = () => {
    const { address } = useAccount()
    const abi = getContractABI(contractType.RecurringPayment)

    return useQuery<PlanDetails[]>({
        queryKey: ["paymentPlans", address],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,
        queryFn: async (): Promise<PlanDetails[]> => {
            if (!address) return []

            // 1. Fetch all plans for the connected user
            const response = await graphqlClient.request<PlansByPayerResponse>(GET_PLANS_BY_PAYER, {
                payer: address,
            })
            const plans = response.RecurringPaymentFactory_PlanCreated ?? []

            if (!plans.length) return []

            // 2. Fetch data for each plan in parallel
            const planDetails = await Promise.all(
                plans.map(async ({ plan, recipient, title }) => {
                    // Read ETH balance
                    const balance = await getBalance(wagmiConfig, {
                        address: plan as `0x${string}`,
                    })

                    // Read contract values
                    const [planStatus, paymentAmount, paymentInterval] = await Promise.all([
                        await readContract(wagmiConfig, {
                            address: plan as `0x${string}`,
                            abi,
                            functionName: "status",
                            args: [],
                        }),
                        await readContract(wagmiConfig, {
                            address: plan as `0x${string}`,
                            abi,
                            functionName: "amount",
                            args: [],
                        }),
                        await readContract(wagmiConfig, {
                            address: plan as `0x${string}`,
                            abi,
                            functionName: "interval",
                            args: [],
                        }),
                    ])

                    // Get payment details for each plan
                    const responsePayments = await graphqlClient.request<PaymentExecutedResponse>(
                        GET_PAYMENT_DETAILS_BY_PLAN,
                        { plan }
                    )
                    const payments = responsePayments?.RecurringPayment_PaymentExecuted ?? []

                    // Manual aggregation
                    const numberOfPayments = payments.length

                    const totalAmountOfPayment = payments
                        .reduce((acc, p) => acc + BigInt(p.amount), BigInt(0))
                        .toString()

                    const timestamps = payments.map((p) => Number(p.timestamp))
                    const firstPayment = timestamps.length > 0 ? Math.min(...timestamps) : null
                    const lastPayment = timestamps.length > 0 ? Math.max(...timestamps) : null

                    // *************** AGGREGATE QUERIES ***************

                    // cannot be used with the free Envio developer plan, however, they can be used on a local deployment with Hasura

                    // const { RecurringPayment_PaymentExecuted_aggregate } = await graphqlClient.request(
                    //     GET_PAYMENT_DETAILS_BY_PLAN_AGGR,
                    //     {
                    //         plan: plan,
                    //     }
                    // )
                    // const payments = RecurringPayment_PaymentExecuted_aggregate.aggregate

                    // const numberOfPayments = agg.count
                    // const totalAmountOfPayment = agg.sum?.amount ?? "0"
                    // const firstPayment = agg.min?.timestamp ?? null
                    // const lastPayment = agg.max?.timestamp ?? null

                    return {
                        planAddress: plan,
                        recipient,
                        balance: balance?.value.toString(),
                        status: Number(planStatus),
                        paymentAmount: (paymentAmount as bigint).toString(),
                        paymentInterval: Number(paymentInterval),
                        numberOfPayments,
                        totalAmountOfPayment,
                        firstPayment,
                        lastPayment,
                        title,
                    }
                })
            )

            if (!planDetails.length) return []

            //console.log("planDetails: ", planDetails)
            return planDetails
        },
    })
}
