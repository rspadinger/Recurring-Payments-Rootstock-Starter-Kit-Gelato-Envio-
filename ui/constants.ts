import RecurringPaymentFactoryAbi from "@/abi/RecurringPaymentFactory.json"
import RecurringPaymentAbi from "@/abi/RecurringPayment.json"

export type ContractType = "RecurringPaymentFactory" | "RecurringPayment"

export type ContractInfo = {
    abi: any
    addresses?: Record<number, `0x${string}` | undefined> // chainId -> address
}

export const CONTRACTS: Record<ContractType, ContractInfo> = {
    RecurringPaymentFactory: {
        abi: RecurringPaymentFactoryAbi,
        addresses: {
            30: undefined, // RSK Mainnet
            31: process.env.NEXT_PUBLIC_PAYMENT_FACTORY_ADDRESS_31 as `0x${string}`, // RSK Testnet
        },
    },
    RecurringPayment: {
        abi: RecurringPaymentAbi,
    },
} as const

export const contractType = {
    RecurringPaymentFactory: "RecurringPaymentFactory",
    RecurringPayment: "RecurringPayment",
} as const

export const CHAIN_ID_RSKMAIN = 30
export const CHAIN_ID_RSKTEST = 31

export const NATIVE_SYMBOL = "RSK"

export const PRIVY_APP_ID_RSKTEST = process.env.NEXT_PUBLIC_PRIVY_APP_ID_RSKTEST

export const ALCHEMY_RPC_RSKTEST = process.env.NEXT_PUBLIC_ALCHEMY_RPC_RSKTEST

//export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_TARGET_CHAINID)
export const ALLOWED_CHAIN_IDS = [30, 31]
