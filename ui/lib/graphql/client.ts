import { GraphQLClient } from "graphql-request"

const envioUrl = process.env.NEXT_PUBLIC_ENVIO_URL

if (!envioUrl) {
    throw new Error("Missing NEXT_PUBLIC_ENVIO_URL environment variable")
}

export const graphqlClient = new GraphQLClient(envioUrl)
