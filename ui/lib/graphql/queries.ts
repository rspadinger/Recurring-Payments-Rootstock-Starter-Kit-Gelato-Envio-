import { gql } from "graphql-request"

// const { RecurringPaymentFactory_PlanCreated: plans_ql } = await graphqlClient.request(GET_PLANS_BY_PAYER, {
//     payer: "0xB1b504848e1a5e90aEAA1D03A06ECEee55562803",
// })
//console.log("DATA: ", plans_ql[0].amount) // .recipient .planAddress
export const GET_PLANS_BY_PAYER = gql`
    query GetPlansByPayer($payer: String!) {
        RecurringPaymentFactory_PlanCreated(where: { payer: { _eq: $payer } }) {
            amount
            interval
            planAddress
            recipient
        }
    }
`

// const { RecurringPayment_PaymentExecuted_aggregate: planDetails_ql } = await graphqlClient.request(
//     GET_PAYMENT_DETAILS_BY_PLAN,
//     { plan: "0x64748677Bde4c2eEd203Be4E2432De8CB9019593" }
// )
//console.log("Plan details: ", planDetails_ql.aggregate.sum.amount) //.count .sum.amount .max.timestamp .min.timestamp
export const GET_PAYMENT_DETAILS_BY_PLAN = gql`
    query GetPaymentDetailsByPlan($plan: String!) {
        RecurringPayment_PaymentExecuted_aggregate(where: { planAddress: { _eq: $plan } }) {
            aggregate {
                count
                sum {
                    amount
                }
                min {
                    timestamp
                }
                max {
                    timestamp
                }
            }
        }
    }
`

export const GET_TOTAL_PAYMENTS_BY_PAYER = gql`
    query GetTotalPaymentsByPayer($payer: String!) {
        RecurringPayment_PaymentExecuted_aggregate(where: { payer: { _eq: $payer } }) {
            aggregate {
                count(columns: amount)
                sum {
                    amount
                }
            }
        }
    }
`

export const GET_PAYMENTS_DETAILS_BY_PAYER = gql`
    query GetPaymentsDetailsByPayer($payer: String!) {
        RecurringPayment_PaymentExecuted(where: { payer: { _eq: $payer } }) {
            planAddress
            amount
            recipient
            timestamp
        }
    }
`

export const GET_FUNDING_DETAILS_BY_PAYER = gql`
    query GetFundingDetailsByPayer($payer: String!) {
        RecurringPayment_FundsAdded(where: { planOwner: { _eq: $payer } }) {
            plan
            payer
            amount
            timestamp
        }
    }
`

// **************** NOT REQUIRED ****************

export const GET_RECIPIENTS_BY_PAYER = gql`
    query GetRecipientsByPayer($payer: String!) {
        RecurringPayment_PaymentExecuted(distinct_on: recipient, where: { payer: { _eq: $payer } }) {
            recipient
        }
    }
`

export const GET_PLANS_BY_PAYER_FROM_EXECUTED = gql`
    query GetPlansByPayerFromExecuted($payer: String!) {
        RecurringPayment_PaymentExecuted(distinct_on: planAddress, where: { payer: { _eq: $payer } }) {
            planAddress
        }
    }
`

export const GET_MIN_MAX_TIMESTAMP_BY_PAYER = gql`
    query GetMinMaxTimestampByPayer($payer: String!) {
        RecurringPayment_PaymentExecuted_aggregate(where: { payer: { _eq: $payer } }) {
            aggregate {
                max {
                    timestamp
                }
                min {
                    timestamp
                }
            }
        }
    }
`

export const GET_FILTERED_PAYMENTS_DETAILS_BY_PAYER = gql`
    query GetFilteredPaymentsDetailsByPayer(
        $payer: String!
        $plans: [String!]!
        $recipients: [String!]!
        $start: timestamptz!
        $end: timestamptz!
    ) {
        RecurringPayment_PaymentExecuted(
            where: {
                payer: { _eq: $payer }
                planAddress: { _in: $plans }
                recipient: { _in: $recipients }
                timestamp: { _gte: $start, _lte: $end }
            }
        ) {
            planAddress
            amount
            recipient
            timestamp
        }
    }
`
