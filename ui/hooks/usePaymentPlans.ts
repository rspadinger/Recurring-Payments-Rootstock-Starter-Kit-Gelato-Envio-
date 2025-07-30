import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { getBalance, readContract } from "@wagmi/core"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_PLANS_BY_PAYER, GET_PAYMENT_DETAILS_BY_PLAN } from "@/lib/graphql/queries"
import { wagmiConfig } from "@/lib/web3/wagmiConfig"
import { contractType } from "@/constants"
import { getContractABI } from "@/lib/contracts/utils"

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
}

export const usePaymentPlans = () => {
    const { address } = useAccount()
    const abi = getContractABI(contractType.RecurringPayment)

    return useQuery<PlanDetails[]>({
        queryKey: ["paymentPlans", address],
        enabled: !!address,
        staleTime: 10_000,
        refetchInterval: 10_000,

        queryFn: async () => {
            if (!address) return []

            // 1. Fetch all plans for the connected user
            const { RecurringPaymentFactory_PlanCreated: plans_ql } = await graphqlClient.request(GET_PLANS_BY_PAYER, {
                payer: address,
            })

            if (!plans_ql.length) return []

            // 2. Fetch data for each plan in parallel
            const planDetails = await Promise.all(
                plans_ql.map(async ({ planAddress, recipient }) => {
                    // Read ETH balance
                    const balance = await getBalance(wagmiConfig, {
                        address: planAddress,
                    })

                    //@note add status call !
                    // Read contract values
                    const status = 0
                    //const [status, paymentAmount, paymentInterval] = await Promise.all([
                    const [paymentAmount, paymentInterval] = await Promise.all([
                        // await readContract(wagmiConfig, {
                        //     address: planAddress,
                        //     abi,
                        //     functionName: "status",
                        // }),
                        await readContract(wagmiConfig, {
                            address: planAddress,
                            abi,
                            functionName: "amount",
                        }),
                        await readContract(wagmiConfig, {
                            address: planAddress,
                            abi,
                            functionName: "interval",
                        }),
                    ])

                    // Get GraphQL aggregate data
                    const { RecurringPayment_PaymentExecuted_aggregate } = await graphqlClient.request(
                        GET_PAYMENT_DETAILS_BY_PLAN,
                        {
                            plan: planAddress,
                        }
                    )

                    const agg = RecurringPayment_PaymentExecuted_aggregate.aggregate

                    return {
                        planAddress,
                        recipient,
                        balance: balance?.value.toString(),
                        status: Number(status),
                        paymentAmount: paymentAmount.toString(),
                        paymentInterval: Number(paymentInterval),
                        numberOfPayments: agg.count,
                        totalAmountOfPayment: agg.sum?.amount ?? "0",
                        firstPayment: agg.min?.timestamp ?? null,
                        lastPayment: agg.max?.timestamp ?? null,
                    }
                })
            )

            if (!planDetails.length) return []

            //console.log("planDetails: ", planDetails)
            return planDetails
        },
    })
}
