"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
// @ts-expect-error working fine
import { useAccount, useConfig } from "wagmi"
import { waitForTransactionReceipt } from "wagmi/actions"
import { contractType } from "@/constants"
import { useContractWrite } from "@/hooks/useContractWrite"
import { usePaymentPlans } from "@/hooks/usePaymentPlans"
import PageState from "@/components/common/page-state"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

import {
    Copy,
    Info,
    Clock,
    DollarSign,
    Calendar,
    Wallet,
    Activity,
    Edit3,
    CheckCircle,
    XCircle,
    PauseCircle,
    CheckCheck,
    Pause,
    Play,
    X,
    Bitcoin,
} from "lucide-react"

import {
    formatWeiAmount,
    formatTimestamp,
    formatInterval,
    convertToSeconds,
    convertToWei,
    abbreviateAddress,
    copyToClipboard,
} from "@/lib/utils"

interface PaymentPlan {
    planAddress: string
    balance: string
    status: number
    recipient: string
    numberOfPayments: number
    totalAmountOfPayment: string
    firstPayment: number
    lastPayment: number
    paymentInterval: number
    paymentAmount: string
    title?: string
}

export default function PaymentPlansPage() {
    const { authenticated, ready } = usePrivy()
    const { address } = useAccount()
    const { data: paymentPlans, isLoading, isError } = usePaymentPlans()
    const wagmiConfig = useConfig()
    const { executeWrite } = useContractWrite()

    const [plans, setPlans] = useState<PaymentPlan[]>([])
    const [status, setStatus] = useState("")
    const [isUpdatingAmount, setIsUpdatingAmount] = useState(false)
    const [isUpdatingInterval, setIsUpdatingInterval] = useState(false)
    const [isPausing, setIsPausing] = useState(false)
    const [isResuming, setIsResuming] = useState(false)
    const [isCanceling, setIsCanceling] = useState(false)
    const [updatingPlanAddress, setUpdatingPlanAddress] = useState<string | null>(null)

    const [editingInterval, setEditingInterval] = useState<string | null>(null)
    const [editingAmount, setEditingAmount] = useState<string | null>(null)
    const [intervalValues, setIntervalValues] = useState<Record<string, { duration: string; unit: string }>>({})
    const [amountValues, setAmountValues] = useState<Record<string, { amount: string; unit: string }>>({})

    const [isFunding, setIsFunding] = useState(false)
    const [fundingValues, setFundingValues] = useState<Record<string, { amount: string; unit: string }>>({})

    useEffect(() => {
        if (!isLoading && paymentPlans && !isError) {
            setPlans(paymentPlans)
        }
    }, [isLoading, isError, paymentPlans])

    const getStatusInfo = (status: number) => {
        switch (status) {
            case 0:
                return { label: "Active", variant: "secondary" as const, icon: CheckCircle, color: "text-green-600" }
            case 1:
                return { label: "Paused", variant: "secondary" as const, icon: PauseCircle, color: "text-yellow-600" }
            case 2:
                return { label: "Canceled", variant: "destructive" as const, icon: XCircle, color: "text-red-600" }
            default:
                return { label: "Unknown", variant: "outline" as const, icon: Activity, color: "text-gray-600" }
        }
    }

    const handleIntervalEdit = (planAddress: string) => {
        const plan = plans.find((p) => p.planAddress === planAddress)
        if (plan) {
            const formatted = formatInterval(plan.paymentInterval)
            setIntervalValues((prev) => ({
                ...prev,
                [planAddress]: { duration: formatted.value.toString(), unit: formatted.unit },
            }))
            setEditingInterval(planAddress)
        }
    }

    const handleAmountEdit = (planAddress: string) => {
        const plan = plans.find((p) => p.planAddress === planAddress)
        if (plan) {
            const formatted = formatWeiAmount(plan.paymentAmount)
            setAmountValues((prev) => ({
                ...prev,
                [planAddress]: {
                    amount: formatted.value,
                    unit: formatted.unit.toLowerCase() as "wei" | "gwei" | "eth",
                },
            }))
            setEditingAmount(planAddress)
        }
    }

    const handlePause = async (planAddress: string) => {
        if (!address || isPausing) return

        setStatus("Pausing recurring payment plan...")

        try {
            setIsPausing(true)
            setUpdatingPlanAddress(planAddress)

            const { result: pauseHash, status: pauseStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "pausePlan",
                args: [],
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!pauseHash) {
                if (pauseStatus?.includes("User denied")) return
                toast.error(pauseStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: pauseHash })

            // Update local state
            setPlans((prev) => prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, status: 1 } : plan)))

            toast.success("Payment plan paused successfully!")
        } catch (err) {
            console.log("Error pausing plan:", err)
            toast.error("Failed to pause payment plan")
        } finally {
            setIsPausing(false)
            setUpdatingPlanAddress(null)
            setStatus("")
        }
    }

    const handleResume = async (planAddress: string) => {
        if (!address || isResuming) return

        setStatus("Resuming recurring payment plan...")

        try {
            setIsResuming(true)
            setUpdatingPlanAddress(planAddress)

            const { result: resumeHash, status: resumeStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "resumePlan",
                args: [],
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!resumeHash) {
                if (resumeStatus?.includes("User denied")) return
                toast.error(resumeStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: resumeHash })

            // Update local state
            setPlans((prev) => prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, status: 0 } : plan)))

            toast.success("Payment plan resumed successfully!")
        } catch (err) {
            console.log("Error resuming plan:", err)
            toast.error("Failed to resume payment plan")
        } finally {
            setIsResuming(false)
            setUpdatingPlanAddress(null)
            setStatus("")
        }
    }

    const handleCancel = async (planAddress: string) => {
        if (!address || isCanceling) return

        setStatus("Canceling recurring payment plan...")

        try {
            setIsCanceling(true)
            setUpdatingPlanAddress(planAddress)

            const { result: cancelHash, status: cancelStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "cancelPlan",
                args: [],
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!cancelHash) {
                if (cancelStatus?.includes("User denied")) return
                toast.error(cancelStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: cancelHash })

            // Update local state
            setPlans((prev) => prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, status: 2 } : plan)))

            toast.success("Payment plan canceled successfully!")
        } catch (err) {
            console.log("Error canceling plan:", err)
            toast.error("Failed to cancel payment plan")
        } finally {
            setIsCanceling(false)
            setUpdatingPlanAddress(null)
            setStatus("")
        }
    }

    const saveIntervalChange = async (planAddress: string) => {
        if (!address || isUpdatingInterval) return

        const values = intervalValues[planAddress]
        if (!values) return

        const duration = Number.parseFloat(values.duration)
        if (isNaN(duration) || duration <= 0) {
            toast.error("Invalid interval duration")
            return
        }

        const totalSeconds = convertToSeconds(duration, values.unit)
        if (totalSeconds < 60) {
            toast.error("Interval must be at least 60 seconds")
            return
        }

        setPlans((prev) =>
            prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, paymentInterval: totalSeconds } : plan))
        )

        setEditingInterval(null)

        setStatus("Updating payment interval for recurring payment plan...")

        try {
            setUpdatingPlanAddress(planAddress)
            setIsUpdatingInterval(true)

            const { result: updateIntervalHash, status: updateIntervalStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "setInterval",
                args: [totalSeconds],
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!updateIntervalHash) {
                if (updateIntervalStatus?.includes("User denied")) return
                toast.error(updateIntervalStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: updateIntervalHash })
            toast.success("Payment interval updated successfully!")
        } catch (err) {
            console.log("Error updating payment interval:", err)
            toast.error("Failed to update payment interval")
        } finally {
            setIsUpdatingInterval(false)
            setUpdatingPlanAddress(null)
            setStatus("")
        }
    }

    const saveAmountChange = async (planAddress: string) => {
        if (!address || isUpdatingAmount) return

        const values = amountValues[planAddress]
        if (!values) return

        const amount = Number.parseFloat(values.amount.trim())
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid payment amount")
            return
        }

        const weiAmount = convertToWei(values.amount, values.unit as "wei" | "gwei" | "eth")

        setPlans((prev) =>
            prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, paymentAmount: weiAmount } : plan))
        )

        setEditingAmount(null)

        setStatus("Updating payment amount for recurring payment plan...")

        try {
            setUpdatingPlanAddress(planAddress)
            setIsUpdatingAmount(true)

            const { result: updateAmountHash, status: updateAmountStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "setAmount",
                args: [weiAmount],
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!updateAmountHash) {
                if (updateAmountStatus?.includes("User denied")) return
                toast.error(updateAmountStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: updateAmountHash })
            toast.success("Payment amount updated successfully!")
        } catch (err) {
            console.log("Error updating payment amount:", err)
            toast.error("Failed to update payment amount")
        } finally {
            setIsUpdatingAmount(false)
            setStatus("")
            setUpdatingPlanAddress(null)
        }
    }

    const cancelEdit = () => {
        setEditingInterval(null)
        setEditingAmount(null)
    }

    const handleFund = async (planAddress: string) => {
        if (!address || isFunding) return

        const values = fundingValues[planAddress]
        if (!values) return

        const amount = Number.parseFloat(values.amount.trim())
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid funding amount")
            return
        }

        const weiAmount = convertToWei(values.amount, values.unit as "wei" | "gwei" | "eth")

        setStatus("Funding recurring payment plan...")

        try {
            setUpdatingPlanAddress(planAddress)
            setIsFunding(true)

            const { result: fundHash, status: fundStatus } = await executeWrite({
                contract: contractType.RecurringPayment,
                functionName: "addFunds",
                args: [],
                value: weiAmount,
                overrideAddress: planAddress,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!fundHash) {
                if (fundStatus?.includes("User denied")) return
                toast.error(fundStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: fundHash })

            // Clear the funding input after successful funding
            setFundingValues((prev) => ({
                ...prev,
                [planAddress]: { amount: "", unit: "wei" },
            }))

            toast.success("Payment plan funded successfully!")
        } catch (err) {
            console.log("Error funding plan:", err)
            toast.error("Failed to fund payment plan")
        } finally {
            setIsFunding(false)
            setUpdatingPlanAddress(null)
            setStatus("")
        }
    }

    const showFallback = (
        <PageState
            ready={ready}
            authenticated={authenticated}
            address={address}
            isLoading={isLoading}
            isError={isError}
            loadingTitle="Loading Your Recurring Payment Plans"
            loadingMessage="Searching the blockchain for recurring payment plans..."
            errorTitle="Error Loading Plans"
            errorMessage="There was a problem loading your recurring payment plans. Please try again later."
        />
    )

    if (!ready || !authenticated || !address || isLoading || isError) {
        return showFallback
    }

    return (
        <TooltipProvider>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="hidden sm:block text-3xl font-bold text-foreground mb-4">
                        Your Recurring Payment Plans
                    </h1>
                    <h1 className="block sm:hidden text-3xl font-bold text-foreground mb-4">Your Payment Plans</h1>
                    <p className="hidden md:block text-lg text-muted-foreground max-w-3xl mx-auto">
                        View and manage your existing recurring payment plans. Update payment intervals, change payment
                        amounts, and monitor performance.
                    </p>
                </div>

                {/* Plans Listing */}
                <div className="space-y-6">
                    {plans?.length === 0 ? (
                        <Card className="text-center py-12 empty-state-card">
                            <CardContent>
                                <div className="flex flex-col items-center space-y-4">
                                    <Wallet className="h-16 w-16 text-cyan-400" />
                                    <h3 className="text-xl font-semibold">No Payment Plans Yet</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        {"You haven't created any recurring payment plans yet."}
                                    </p>
                                    <Link href="/">
                                        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                            Create Your First Plan
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        plans.map((plan) => {
                            const statusInfo = getStatusInfo(plan.status)
                            const StatusIcon = statusInfo.icon
                            const balanceFormatted = formatWeiAmount(plan.balance)
                            const totalPaidFormatted = formatWeiAmount(plan.totalAmountOfPayment)
                            const paymentAmountFormatted = formatWeiAmount(plan.paymentAmount)
                            const intervalFormatted = formatInterval(plan.paymentInterval)

                            return (
                                <Card key={plan.planAddress} className="w-full plan-card">
                                    <CardHeader className="pb-2 pt-2 plan-card-header">
                                        <div className="flex flex-row items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                                                    <Activity className="h-5 w-5 text-cyan-600" />
                                                    {plan.title || "Untitled Plan"}
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <div className="hidden sm:flex items-center gap-2">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                {abbreviateAddress(plan.planAddress)}
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyToClipboard(plan.planAddress)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <div>
                                                            <Badge
                                                                variant={statusInfo.variant}
                                                                className={`flex items-center gap-1 text-gray-800 ${
                                                                    plan.status === 0
                                                                        ? "status-active"
                                                                        : plan.status === 1
                                                                        ? "status-paused"
                                                                        : "status-canceled"
                                                                }`}
                                                            >
                                                                <StatusIcon className="h-3 w-3" />
                                                                {statusInfo.label}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs sm:text-sm font-medium">Balance</p>
                                                    <p className="text-xs sm:text-base font-semibold text-cyan-700">
                                                        {balanceFormatted.value} {balanceFormatted.unit}
                                                    </p>
                                                </div>

                                                {/* Plan Control Buttons */}
                                                <div className="flex flex-col gap-1">
                                                    {/* Active Plan */}
                                                    {plan.status === 0 && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    isPausing &&
                                                                    updatingPlanAddress === plan.planAddress
                                                                }
                                                                onClick={() => handlePause(plan.planAddress)}
                                                                className="h-5 px-1.5 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                                                            >
                                                                {isPausing &&
                                                                    updatingPlanAddress === plan.planAddress && (
                                                                        <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />
                                                                    )}
                                                                <Pause className="h-3 w-3 mr-1" />
                                                                Pause
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    isCanceling &&
                                                                    updatingPlanAddress === plan.planAddress
                                                                }
                                                                onClick={() => handleCancel(plan.planAddress)}
                                                                className="h-5 px-1.5 text-[10px] sm:h-6 sm:px-2 sm:text-xs mt-1 bg-gray-200 text-red-600 hover:text-red-700 border-1 border-red-800 hover:border-red-300"
                                                            >
                                                                {isCanceling &&
                                                                    updatingPlanAddress === plan.planAddress && (
                                                                        <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />
                                                                    )}
                                                                <X className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}
                                                    {/* Paused Plan */}
                                                    {plan.status === 1 && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    isResuming &&
                                                                    updatingPlanAddress === plan.planAddress
                                                                }
                                                                onClick={() => handleResume(plan.planAddress)}
                                                                className="h-6 px-2 text-xs text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                                            >
                                                                {isResuming &&
                                                                    updatingPlanAddress === plan.planAddress && (
                                                                        <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />
                                                                    )}
                                                                <Play className="h-3 w-3 mr-1" />
                                                                Resume
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    isCanceling &&
                                                                    updatingPlanAddress === plan.planAddress
                                                                }
                                                                onClick={() => handleCancel(plan.planAddress)}
                                                                className="h-6 px-2 mt-1 text-xs bg-gray-200 text-red-600 hover:text-red-700 border-1 border-red-800 hover:border-red-300"
                                                            >
                                                                {isCanceling &&
                                                                    updatingPlanAddress === plan.planAddress && (
                                                                        <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />
                                                                    )}
                                                                <X className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}
                                                    {/* No buttons for canceled plans (status === 2) */}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6 ">
                                        {/* Plan Details */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-t pt-6">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium">
                                                    <Wallet className="h-4 w-4 text-cyan-600" />
                                                    Recipient
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                                        {abbreviateAddress(plan.recipient)}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(plan.recipient)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="hidden sm:block h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium">
                                                    <CheckCheck className="h-4 w-4" />
                                                    Payments Made
                                                </Label>
                                                <p className="text-lg font-semibold">{plan.numberOfPayments}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium">
                                                    <DollarSign className="h-4 w-4" />
                                                    Total Paid
                                                </Label>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {totalPaidFormatted.value} {totalPaidFormatted.unit}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium">
                                                    <Calendar className="h-4 w-4 text-cyan-600" />
                                                    First Payment
                                                </Label>
                                                <p className="text-sm">{formatTimestamp(plan.firstPayment)}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium">
                                                    <Calendar className="h-4 w-4 text-cyan-600" />
                                                    Last Payment
                                                </Label>
                                                <p className="text-sm">{formatTimestamp(plan.lastPayment)}</p>
                                            </div>
                                        </div>

                                        {/* Editable Fields */}
                                        <div className="border-t pt-6">
                                            <div className="editable-section">
                                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                    <Edit3 className="h-4 w-4 text-cyan-600" />
                                                    Editable Settings
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {/* Payment Interval */}
                                                    <div className="space-y-3 border rounded p-4">
                                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                                            <Clock className="h-4 w-4 text-cyan-600" />
                                                            Payment Interval
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Minimum interval is 60 seconds</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </Label>

                                                        {editingInterval === plan.planAddress ? (
                                                            <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Duration"
                                                                        value={
                                                                            intervalValues[plan.planAddress]
                                                                                ?.duration || ""
                                                                        }
                                                                        onChange={(e) =>
                                                                            setIntervalValues((prev) => ({
                                                                                ...prev,
                                                                                [plan.planAddress]: {
                                                                                    ...prev[plan.planAddress],
                                                                                    duration: e.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                        className="flex-1"
                                                                    />
                                                                    <Select
                                                                        value={
                                                                            intervalValues[plan.planAddress]?.unit ||
                                                                            "seconds"
                                                                        }
                                                                        onValueChange={(value) =>
                                                                            setIntervalValues((prev) => ({
                                                                                ...prev,
                                                                                [plan.planAddress]: {
                                                                                    ...prev[plan.planAddress],
                                                                                    unit: value,
                                                                                },
                                                                            }))
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="w-32">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="seconds">
                                                                                Seconds
                                                                            </SelectItem>
                                                                            <SelectItem value="minutes">
                                                                                Minutes
                                                                            </SelectItem>
                                                                            <SelectItem value="hours">Hours</SelectItem>
                                                                            <SelectItem value="days">Days</SelectItem>
                                                                            <SelectItem value="weeks">Weeks</SelectItem>
                                                                            <SelectItem value="months">
                                                                                Months
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            saveIntervalChange(plan.planAddress)
                                                                        }
                                                                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={cancelEdit}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm ">
                                                                    {intervalFormatted.value} {intervalFormatted.unit}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        isUpdatingInterval &&
                                                                        updatingPlanAddress === plan.planAddress
                                                                    }
                                                                    onClick={() => handleIntervalEdit(plan.planAddress)}
                                                                >
                                                                    {isUpdatingInterval &&
                                                                        updatingPlanAddress === plan.planAddress && (
                                                                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                                        )}
                                                                    Change Interval
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Payment Amount */}
                                                    <div className="space-y-3 border rounded p-4">
                                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                                            <Bitcoin className="h-4 w-4 text-cyan-600" />
                                                            Payment Amount
                                                        </Label>

                                                        {editingAmount === plan.planAddress ? (
                                                            <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        step="any"
                                                                        min="0"
                                                                        placeholder="Amount"
                                                                        value={
                                                                            amountValues[plan.planAddress]?.amount || ""
                                                                        }
                                                                        onChange={(e) =>
                                                                            setAmountValues((prev) => ({
                                                                                ...prev,
                                                                                [plan.planAddress]: {
                                                                                    ...prev[plan.planAddress],
                                                                                    amount: e.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                        className="flex-1"
                                                                    />
                                                                    <Select
                                                                        value={
                                                                            amountValues[plan.planAddress]?.unit ||
                                                                            "wei"
                                                                        }
                                                                        onValueChange={(value) =>
                                                                            setAmountValues((prev) => ({
                                                                                ...prev,
                                                                                [plan.planAddress]: {
                                                                                    ...prev[plan.planAddress],
                                                                                    unit: value,
                                                                                },
                                                                            }))
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="w-24">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="wei">Wei</SelectItem>
                                                                            <SelectItem value="gwei">Gwei</SelectItem>
                                                                            <SelectItem value="eth">RBTC</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            saveAmountChange(plan.planAddress)
                                                                        }
                                                                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={cancelEdit}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm">
                                                                    {paymentAmountFormatted.value}{" "}
                                                                    {paymentAmountFormatted.unit}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        isUpdatingAmount &&
                                                                        updatingPlanAddress === plan.planAddress
                                                                    }
                                                                    onClick={() => handleAmountEdit(plan.planAddress)}
                                                                >
                                                                    {isUpdatingAmount &&
                                                                        updatingPlanAddress === plan.planAddress && (
                                                                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                                        )}
                                                                    Change Amount
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Funding Amount */}
                                                    <div className="space-y-3 border rounded p-4">
                                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                                            <Bitcoin className="h-4 w-4 text-cyan-600" />
                                                            Plan Funding
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        Top up this plan to ensure future payments are
                                                                        funded
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </Label>

                                                        <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="number"
                                                                    step="any"
                                                                    min="0"
                                                                    placeholder="Amount"
                                                                    value={
                                                                        fundingValues[plan.planAddress]?.amount || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        setFundingValues((prev) => ({
                                                                            ...prev,
                                                                            [plan.planAddress]: {
                                                                                ...prev[plan.planAddress],
                                                                                amount: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                    className="flex-1"
                                                                />
                                                                <Select
                                                                    value={
                                                                        fundingValues[plan.planAddress]?.unit || "wei"
                                                                    }
                                                                    onValueChange={(value) =>
                                                                        setFundingValues((prev) => ({
                                                                            ...prev,
                                                                            [plan.planAddress]: {
                                                                                ...prev[plan.planAddress],
                                                                                unit: value,
                                                                            },
                                                                        }))
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-22">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="wei">Wei</SelectItem>
                                                                        <SelectItem value="gwei">Gwei</SelectItem>
                                                                        <SelectItem value="eth">RBTC</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleFund(plan.planAddress)}
                                                                    disabled={
                                                                        (isFunding &&
                                                                            updatingPlanAddress === plan.planAddress) ||
                                                                        !fundingValues[plan.planAddress]?.amount
                                                                    }
                                                                    className=" bg-cyan-500 hover:bg-cyan-600 text-white"
                                                                >
                                                                    {isFunding &&
                                                                        updatingPlanAddress === plan.planAddress && (
                                                                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                                                                        )}
                                                                    <span className="block xl:hidden">Fund</span>
                                                                    <span className="hidden xl:block">Fund Plan</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Message */}
                                        {status && updatingPlanAddress === plan.planAddress && (
                                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                <div className="flex items-start space-x-3">
                                                    <Info className="h-5 w-5 text-cyan-500 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-foreground">{status}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                {/* Create New Plan Link */}
                {plans.length > 0 && (
                    <div className="text-center mt-8">
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-600 bg-white"
                            >
                                Create New Payment Plan
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}
