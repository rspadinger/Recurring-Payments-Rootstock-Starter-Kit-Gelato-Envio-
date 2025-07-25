const { request, gql } = require("graphql-request")

const endpoint = "http://localhost:8080/v1/graphql"

const query = gql`
    query MyQuery {
        RecurringPayment_PaymentExecuted(
            where: { planAddress: { _eq: "0x64748677Bde4c2eEd203Be4E2432De8CB9019593" } }
        ) {
            id
            recipient
            planAddress
            amount
        }
    }
`

async function main() {
    const data = await request(endpoint, query)
    console.log(data)
}

main().catch(console.error)
