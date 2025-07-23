"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
// @ts-expect-error working fine
import { useAccount, useBalance, useWriteContract, useConfig } from "wagmi"
import { readContract } from "@wagmi/core"
import { waitForTransactionReceipt } from "wagmi/actions"
import { erc20Abi, zeroAddress, isAddress, formatUnits, parseUnits } from "viem"

import { Coins, HandCoins } from "lucide-react"
import { toast } from "sonner"

import TokenOverview from "@/components/inheritance/token-overview"
import PlanForm from "@/components/inheritance/plan-form"
import HeirsTable from "@/components/inheritance/heirs-table"

import { useSmartContractRead, useSmartContractWrite } from "@/lib/web3/wagmiHelper"
import { useERC20TokenData, getNativeTokenAmount } from "@/lib/web3/tokenHelper"
import { isValidFutureDate, getIsoDateFromTimestamp, getTimestampFromIsoDate } from "@/lib/validators"

interface TokenBalance {
    address: string
    symbol: string
    name: string
    decimals: number
    balance: number
    icon: React.ReactNode
}

interface Heir {
    id: string
    address: string
    tokenAmounts: { [symbol: string]: number }
}

export default function Home() {
    const { user, ready, authenticated } = usePrivy()
    const { address } = useAccount()
    const {
        data: nativeBalance,
        isLoading: loadingNativeBalance,
        refetch: refetchNativeBalance,
    } = useBalance({ address })
    const wagmiConfig = useConfig()
    const { executeWrite } = useSmartContractWrite()
    const { writeContractAsync } = useWriteContract()
    const { tokenData, refetchTokenData, tokenAddresses } = useERC20TokenData()

    // State management
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
    const [isLoadingBalances, setIsLoadingBalances] = useState(false)
    const [hasPlan, setHasPlan] = useState(false)
    const [planAddress, setPlanAddress] = useState<string | undefined>()
    const [planDueDate, setPlanDueDate] = useState("")
    const [heirs, setHeirs] = useState<Heir[]>([])
    const [isCreatingPlan, setIsCreatingPlan] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [status, setStatus] = useState("")

    // call creatorToWill to get the address of the will
    const { data: createdWill } = useSmartContractRead({
        contract: "WillFactory",
        functionName: "creatorToWill",
        args: [address],
    })

    const createdWillReady = !!createdWill && createdWill !== zeroAddress && isAddress(createdWill)

    // call dueDate on LastWill
    const { data: dueDate, refetch: refetchDueDate } = useSmartContractRead({
        contract: "LastWill",
        functionName: "dueDate",
        args: [],
        enabled: createdWillReady,
        overrideAddress: createdWillReady ? createdWill : undefined,
    })

    // call getHeirs on LastWill if createdWillReady => make sure this is called by the owner
    const { data: heirsFromPlan, refetch: refetchHeirs } = useSmartContractRead({
        contract: "LastWill",
        functionName: "getHeirs",
        args: [],
        enabled: createdWillReady,
        overrideAddress: createdWillReady ? createdWill : undefined,
        caller: address,
    })

    //helper function to map heirs from contract to frontend heir structure
    const transformHeirs = (heirsFromPlan, tokenBalances) => {
        if (!heirsFromPlan || heirsFromPlan.length === 0) return []
        const mappedHeirs = heirsFromPlan.map((heir) => {
            const tokenAmounts: Record<string, number> = {}

            heir.tokens.forEach((tokenAddr: string, index: number) => {
                const token = tokenBalances.find((t) => t.address.toLowerCase() === tokenAddr.toLowerCase())
                if (!token) return

                const symbol = token.symbol
                const decimals = token.decimals
                tokenAmounts[symbol] = parseFloat(formatUnits(heir.amounts[index], decimals))
            })

            return {
                id: heir.wallet.toLowerCase(),
                address: heir.wallet,
                tokenAmounts,
            }
        })

        return mappedHeirs
    }

    //helper function to generate arrays for heirs to add and heirs to delete
    const normalizeAddress = (addr: string) => addr.toLowerCase()

    const computeHeirDiff = (
        heirsFromPlan,
        heirs
    ): {
        heirsToAdd: {
            wallet: string
            tokens: string[]
            amounts: bigint[]
            executed: boolean
        }[]
        heirsToDelete: string[]
        tokenDetails: {
            tokenAddress: string
            symbol: string
            amount: bigint
            decimals: number
        }[]
    } => {
        if (!heirsFromPlan) return { heirsToAdd: [], heirsToDelete: [], tokenDetails: [] }

        const existingHeirAddresses = heirsFromPlan.map((h) => normalizeAddress(h.wallet))
        const newHeirAddresses = heirs.map((h) => normalizeAddress(h.address))
        const tokenDetailsMap = new Map<
            string,
            { tokenAddress: string; amount: bigint; decimals: number; symbol: string }
        >()

        const heirsToAdd = heirs
            .filter((h) => !existingHeirAddresses.includes(normalizeAddress(h.address)))
            .map((h) => {
                const tokenSymbols = Object.keys(h.tokenAmounts)

                const tokens: string[] = []
                const amounts: bigint[] = []

                for (const symbol of tokenSymbols) {
                    const tokenMeta = tokenBalances.find((t) => t.symbol === symbol)
                    if (!tokenMeta) continue // skip unknown tokens

                    const rawAmount = h.tokenAmounts[symbol] ?? 0
                    const decimals = tokenMeta.decimals ?? 18
                    const parsedAmount = BigInt(Math.floor(rawAmount * 10 ** decimals))

                    if (parsedAmount > 0) {
                        tokens.push(tokenMeta.address)
                        amounts.push(parsedAmount)

                        const existing = tokenDetailsMap.get(tokenMeta.address)
                        if (!existing) {
                            tokenDetailsMap.set(tokenMeta.address, {
                                tokenAddress: tokenMeta.address,
                                amount: parsedAmount,
                                decimals,
                                symbol,
                            })
                        }
                    }
                }

                return {
                    wallet: h.address,
                    tokens,
                    amounts,
                    executed: false,
                }
            })

        const heirsToDelete = existingHeirAddresses.filter((addr) => !newHeirAddresses.includes(addr))

        return { heirsToAdd, heirsToDelete, tokenDetails: Array.from(tokenDetailsMap.values()) }
    }

    // Load user data when wallet connects
    useEffect(() => {
        if (authenticated && address) {
            loadUserData()
        }
    }, [authenticated, address, tokenData, nativeBalance, createdWill, dueDate, heirsFromPlan])

    const loadUserData = async () => {
        setIsLoadingBalances(true)

        try {
            if (!address || !ready || !authenticated || !tokenData) return

            // iterate all returned ERC20 token data and set tokenBalances
            const tokens: TokenBalance[] = []
            //const [tokenAddresses] = whitelistedTokens

            for (let i = 0; i < tokenData.length; i += 4) {
                const tokenIndex = i / 4
                const address = tokenAddresses[tokenIndex] as string
                const symbol = tokenData[i] as string
                const name = tokenData[i + 1] as string
                const decimals = tokenData[i + 2] as number
                const rawBalance = tokenData[i + 3] as bigint

                tokens.push({
                    address,
                    symbol,
                    name,
                    decimals,
                    balance: Number(rawBalance) / 10 ** decimals,
                    icon: <Coins className="h-6 w-6" />,
                })
            }

            // add native token at the start
            if (nativeBalance) {
                tokens.unshift({
                    address: zeroAddress,
                    symbol: nativeBalance.symbol || "POL",
                    name: nativeBalance.symbol === "ETH" ? "Ether" : nativeBalance.symbol || "Polygon",
                    decimals: 18,
                    balance: Number(nativeBalance.value) / 10 ** nativeBalance.decimals,
                    icon: <HandCoins className="h-6 w-6" />,
                })
            }

            setTokenBalances(tokens)

            if (createdWill && createdWill !== zeroAddress && dueDate !== undefined) {
                const formattedDate = getIsoDateFromTimestamp(dueDate)

                setHasPlan(true)
                setPlanAddress(createdWill)
                setPlanDueDate(formattedDate)

                const transformedHeirs = transformHeirs(heirsFromPlan, tokenBalances)
                setHeirs(transformedHeirs)
            } else {
                setHasPlan(false)
            }
        } catch (error) {
            console.error("Error loading user data:", error)
            toast.error("Failed to load user data")
        } finally {
            setIsLoadingBalances(false)
        }
    }

    const handleCreatePlan = async (formattedDueDate: string) => {
        if (!address || isCreatingPlan) return

        if (!isValidFutureDate(formattedDueDate)) {
            alert("Please select a date at least 1 day in the future.")
            return
        }

        // call createLastWill
        const dueDateTimestamp = getTimestampFromIsoDate(formattedDueDate)
        const { result: hash, status } = await executeWrite({
            contract: "WillFactory",
            functionName: "createLastWill",
            args: [dueDateTimestamp],
        })

        if (!hash) {
            if (status && status.includes("User denied the transaction.")) {
                return
            }

            toast.error(status || "Transaction failed")
            return
        }

        try {
            setIsCreatingPlan(true)

            // wait for the txn to complete
            const transactionReceipt = await waitForTransactionReceipt(wagmiConfig, { hash })

            setPlanDueDate(formattedDueDate)
            setHasPlan(true)

            toast.success("Inheritance plan created successfully!")
            setTxHash(hash)

            // Smooth scroll to heirs section
            setTimeout(() => {
                const heirsSection = document.getElementById("heirs-section")
                if (heirsSection) {
                    heirsSection.scrollIntoView({ behavior: "smooth" })
                }
            }, 100)
        } catch (err) {
            console.error("Error creating plan:", err)
            toast.error("Failed to create inheritance plan")
        } finally {
            setIsCreatingPlan(false)
        }
    }

    const handleDueDateChange = (formattedDueDate: string) => {
        setPlanDueDate(formattedDueDate)
    }

    const handlePlanReset = async () => {
        if (!address || isSaving || !createdWillReady) return

        setIsSaving(true)

        try {
            const { result: hash, status: resetPlanStatus } = await executeWrite({
                contract: "WillFactory",
                functionName: "resetLastWill",
                args: [],
                caller: address,
            })

            if (!hash) {
                if (resetPlanStatus && resetPlanStatus.includes("User denied the transaction.")) {
                    return
                }
                toast.error(status || "Transaction failed")
                return
            }

            const transactionReceipt = await waitForTransactionReceipt(wagmiConfig, { hash })

            toast.success(`Inheritance plan successfully reset!`)
        } catch (error) {
            console.error("Error resetting plan:", error)
            toast.error("Transaction failed. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAndApprove = async () => {
        if (!address || isSaving || !createdWillReady) return

        if (!isValidFutureDate(planDueDate)) {
            alert("Please select a date at least 1 day in the future.")
            return
        }

        const { heirsToAdd, heirsToDelete, tokenDetails } = computeHeirDiff(heirsFromPlan, heirs)
        const ethAmount = getNativeTokenAmount(heirsToAdd)
        const dueDateTimestamp = getTimestampFromIsoDate(planDueDate)

        setIsSaving(true)

        try {
            setStatus("Checking allowance...")

            for (let i = 0; i < tokenDetails.length; i++) {
                const token = tokenDetails[i].tokenAddress
                const symbol = tokenDetails[i].symbol
                const amount = parseUnits(tokenDetails[i].amount.toString(), tokenDetails[i].decimals)

                if (token === zeroAddress) continue

                setStatus(`Checking allowance for ${symbol}...`)
                const allowance = (await readContract(wagmiConfig, {
                    address: token,
                    abi: erc20Abi,
                    functionName: "allowance",
                    args: [address, createdWill],
                })) as bigint

                if (allowance < amount) {
                    setStatus(`Approving ${symbol}...`)
                    await writeContractAsync({
                        address: token,
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [createdWill, amount],
                    })
                    setStatus(`Approved ${symbol}`)
                } else {
                    setStatus(`${symbol} already approved`)
                }
            }

            setStatus("Updating inheritance plan...")

            // call modifyPlan
            const { result: hash, status: modifyPlanStatus } = await executeWrite({
                contract: "LastWill",
                functionName: "modifyPlan",
                args: [dueDateTimestamp, heirsToAdd, heirsToDelete],
                value: ethAmount,
                overrideAddress: createdWillReady ? createdWill : undefined,
                caller: address,
            })

            if (!hash) {
                if (modifyPlanStatus && modifyPlanStatus.includes("User denied the transaction.")) {
                    return
                }
                toast.error(status || "Transaction failed")
                return
            }

            const transactionReceipt = await waitForTransactionReceipt(wagmiConfig, { hash })
            //console.log("transactionReceipt: ", transactionReceipt)

            await refetchNativeBalance()
            await refetchTokenData()
            await refetchDueDate()
            await refetchHeirs()

            toast.success(
                `Inheritance plan successfully updated! Funds will be locked until ${new Date(
                    planDueDate
                ).toLocaleDateString()}`
            )
        } catch (error) {
            if (error?.message?.includes("User rejected the request")) {
                return
            }
            console.error("Error saving plan:", error)
            toast.error("Transaction failed. Please try again.")
        } finally {
            setIsSaving(false)
            setStatus("")
        }
    }

    // Show connection prompt if not authenticated
    if (!authenticated || !address) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="hero-title">Secure Your Digital Legacy</h1>
                    <p className="hero-subtitle max-w-3xl">
                        Create an inheritance plan for your cryptocurrency tokens. Set up automatic transfers
                        to your heirs with our secure smart contract system.
                    </p>
                    <p className="hero-subtitle max-w-3xl mt-2">
                        Connect your wallet to get started and protect your family's financial future.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="app-background container mx-auto px-4 py-8 md:py-12 space-y-8">
            {/* Section 1: Wallet Overview */}
            <TokenOverview balances={tokenBalances} isLoading={isLoadingBalances} />

            {/* Section 2: Plan Setup (only if no plan exists) */}
            {!hasPlan && !isLoadingBalances && (
                <PlanForm onCreatePlan={handleCreatePlan} isCreating={isCreatingPlan} />
            )}

            {/* Section 3: Heirs & Distribution (once plan is created) */}
            {hasPlan && (
                <div id="heirs-section">
                    <HeirsTable
                        dueDate={planDueDate}
                        tokenBalances={tokenBalances.map((token) => ({
                            symbol: token.symbol,
                            balance: token.balance,
                        }))}
                        heirs={heirs}
                        onHeirsChange={setHeirs}
                        onSaveAndApprove={handleSaveAndApprove}
                        onDueDateChange={handleDueDateChange}
                        onPlanReset={handlePlanReset}
                        isSaving={isSaving}
                        status={status}
                    />
                </div>
            )}
        </div>
    )
}
