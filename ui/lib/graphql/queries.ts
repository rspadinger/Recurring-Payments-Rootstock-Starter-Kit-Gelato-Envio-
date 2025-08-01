import { gql } from "graphql-request"

// const { RecurringPaymentFactory_PlanCreated: plans_ql } = await graphqlClient.request(GET_PLANS_BY_PAYER, {
//     payer: "0xB1b504848e1a5e90aEAA1D03A06ECEee55562803",
// })
//console.log("DATA: ", plans_ql[0].amount) // .recipient .plan
export const GET_PLANS_BY_PAYER = gql`
    query GetPlansByPayer($payer: String!) {
        RecurringPaymentFactory_PlanCreated(where: { payer: { _eq: $payer } }) {
            amount
            interval
            plan
            recipient
            title
        }
    }
`

export const GET_PAYMENT_DETAILS_BY_PAYER = gql`
    query GetPaymentsDetailsByPayer($payer: String!) {
        RecurringPayment_PaymentExecuted(where: { payer: { _eq: $payer } }) {
            plan
            amount
            recipient
            timestamp
            title
        }
    }
`

export const GET_PAYMENT_DETAILS_BY_RECIPIENT = gql`
    query GetPaymentsDetailsByRecipient($recipient: String!) {
        RecurringPayment_PaymentExecuted(where: { recipient: { _eq: $recipient } }) {
            plan
            amount
            payer
            timestamp
            title
        }
    }
`

export const GET_PAYMENT_DETAILS_BY_PLAN = gql`
    query GetPaymentsDetailsByPlan($plan: String!) {
        RecurringPayment_PaymentExecuted(where: { plan: { _eq: $plan } }) {
            amount
            timestamp
        }
    }
`

export const GET_FUNDING_DETAILS_BY_PLAN_OWNER = gql`
    query GetFundingDetailsByPlanOwner($planOwner: String!) {
        RecurringPayment_FundsAdded(where: { planOwner: { _eq: $planOwner } }) {
            plan
            payer
            amount
            timestamp
            title
        }
    }
`

// *************** AGGREGATE QUERIES ***************

// those queries cannot be used with the free Envio developer plan, however, they can be used on a local deployment with Hasura

// const { RecurringPayment_PaymentExecuted_aggregate: planDetails_ql } = await graphqlClient.request(
//     GET_PAYMENT_DETAILS_BY_PLAN,
//     { plan: "0x64748677Bde4c2eEd203Be4E2432De8CB9019593" }
// )
//console.log("Plan details: ", planDetails_ql.aggregate.sum.amount) //.count .sum.amount .max.timestamp .min.timestamp
export const GET_PAYMENT_DETAILS_BY_PLAN_AGGR = gql`
    query GetPaymentDetailsByPlan($plan: String!) {
        RecurringPayment_PaymentExecuted_aggregate(where: { plan: { _eq: $plan } }) {
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

export const GET_TOTAL_PAYMENTS_BY_PAYER_AGGR = gql`
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
