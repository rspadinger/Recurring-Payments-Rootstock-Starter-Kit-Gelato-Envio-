"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Calendar, Clock, Wallet, DollarSign } from "lucide-react"
import { toast } from "sonner"

// @ts-expect-error working fine
import { useAccount, useBalance, useWriteContract, useConfig } from "wagmi"
import { waitForTransactionReceipt } from "wagmi/actions"
import { usePrivy } from "@privy-io/react-auth"

import { convertToWei, convertToSeconds } from "@/lib/utils"
import { contractType } from "@/constants"
import { useContractWrite } from "@/lib/contracts/useContractWrite"

interface FormData {
    recipient: string
    paymentAmount: string
    paymentUnit: "wei" | "gwei" | "eth"
    intervalDuration: string
    intervalUnit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months"
    startTime: string
    fundingAmount: string
    fundingUnit: "wei" | "gwei" | "eth"
}

export default function HomePage() {
    const { user, ready, authenticated } = usePrivy()
    const { address } = useAccount()
    const wagmiConfig = useConfig()
    const { executeWrite } = useContractWrite()

    const [recipientError, setRecipientError] = useState("")
    const [paymentAmountError, setPaymentAmountError] = useState("")
    const [intervalDurationError, setIntervalDurationError] = useState("")
    const [startTimeError, setStartTimeError] = useState("")
    const [fundingAmountError, setFundingAmountError] = useState("")

    const [isCreatingPlan, setIsCreatingPlan] = useState(false)
    const [status, setStatus] = useState("")

    const [formData, setFormData] = useState<FormData>({
        recipient: "",
        paymentAmount: "100",
        paymentUnit: "wei",
        intervalDuration: "60",
        intervalUnit: "seconds",
        startTime: "",
        fundingAmount: "500",
        fundingUnit: "wei",
    })

    // Set default start time to now + 2 minutes
    useEffect(() => {
        const now = new Date()
        now.setMinutes(now.getMinutes() + 2)
        const defaultTime = now.toISOString().slice(0, 16)
        setFormData((prev) => ({ ...prev, startTime: defaultTime }))
    }, [])

    // Individual validation functions
    const validateRecipient = (address: string): string => {
        if (!address.trim()) {
            return "Wallet address is required"
        }
        if (!address.startsWith("0x")) {
            return "Wallet address must start with 0x"
        }
        if (address.length !== 42) {
            return "Wallet address must be exactly 42 characters long"
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return "Wallet address contains invalid characters"
        }
        return ""
    }

    const validatePaymentAmount = (amount: string): string => {
        if (!amount.trim()) {
            return "Payment amount is required"
        }
        const num = Number.parseFloat(amount)
        if (isNaN(num)) {
            return "Payment amount must be a valid number"
        }
        if (num <= 0) {
            return "Payment amount must be greater than 0"
        }
        if (num > 1e15) {
            return "Payment amount is too large"
        }
        return ""
    }

    const validateIntervalDuration = (duration: string, unit: string): string => {
        if (!duration.trim()) {
            return "Interval duration is required"
        }
        const num = Number.parseFloat(duration)
        if (isNaN(num)) {
            return "Interval duration must be a valid number"
        }
        if (num <= 0) {
            return "Interval duration must be greater than 0"
        }

        // Convert to seconds for validation
        const multipliers = {
            seconds: 1,
            minutes: 60,
            hours: 3600,
            days: 86400,
            weeks: 604800,
            months: 2592000,
        }

        const totalSeconds = num * multipliers[unit as keyof typeof multipliers]
        if (totalSeconds < 60) {
            return "Interval must be at least 60 seconds"
        }
        if (totalSeconds > 31536000) {
            // 1 year
            return "Interval cannot exceed 1 year"
        }
        return ""
    }

    const validateStartTime = (dateTime: string): string => {
        if (!dateTime.trim()) {
            return "Start time is required"
        }
        const selectedTime = new Date(dateTime)
        const now = new Date()

        if (isNaN(selectedTime.getTime())) {
            return "Invalid date and time format"
        }
        if (selectedTime <= now) {
            return "Start time must be in the future"
        }

        // Check if it's too far in the future (e.g., more than 10 years)
        const tenYearsFromNow = new Date()
        tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)
        if (selectedTime > tenYearsFromNow) {
            return "Start time cannot be more than 10 years in the future"
        }
        return ""
    }

    const validateFundingAmount = (amount: string): string => {
        if (!amount.trim()) {
            return "Funding amount is required"
        }
        const num = Number.parseFloat(amount)
        if (isNaN(num)) {
            return "Funding amount must be a valid number"
        }
        if (num <= 0) {
            return "Funding amount must be greater than 0"
        }
        if (num > 1e18) {
            return "Funding amount is too large"
        }
        return ""
    }

    const handleRecipientChange = (value: string) => {
        setFormData((prev) => ({ ...prev, recipient: value }))
        const error = validateRecipient(value)
        setRecipientError(error)
    }

    const handlePaymentAmountChange = (value: string) => {
        setFormData((prev) => ({ ...prev, paymentAmount: value }))
        const error = validatePaymentAmount(value)
        setPaymentAmountError(error)
    }

    const handleIntervalDurationChange = (value: string) => {
        setFormData((prev) => ({ ...prev, intervalDuration: value }))
        const error = validateIntervalDuration(value, formData.intervalUnit)
        setIntervalDurationError(error)
    }

    const handleIntervalUnitChange = (value: string) => {
        setFormData((prev) => ({ ...prev, intervalUnit: value as any }))
        // Re-validate duration with new unit
        const error = validateIntervalDuration(formData.intervalDuration, value)
        setIntervalDurationError(error)
    }

    const handleStartTimeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, startTime: value }))
        const error = validateStartTime(value)
        setStartTimeError(error)
    }

    const handleFundingAmountChange = (value: string) => {
        setFormData((prev) => ({ ...prev, fundingAmount: value }))
        const error = validateFundingAmount(value)
        setFundingAmountError(error)
    }

    const validateAllFields = (): boolean => {
        const recipientErr = validateRecipient(formData.recipient)
        const paymentErr = validatePaymentAmount(formData.paymentAmount)
        const intervalErr = validateIntervalDuration(formData.intervalDuration, formData.intervalUnit)
        const startTimeErr = validateStartTime(formData.startTime)
        const fundingErr = validateFundingAmount(formData.fundingAmount)

        setRecipientError(recipientErr)
        setPaymentAmountError(paymentErr)
        setIntervalDurationError(intervalErr)
        setStartTimeError(startTimeErr)
        setFundingAmountError(fundingErr)

        return !recipientErr && !paymentErr && !intervalErr && !startTimeErr && !fundingErr
    }

    const isFormValid = (): boolean => {
        return (
            !recipientError &&
            !paymentAmountError &&
            !intervalDurationError &&
            !startTimeError &&
            !fundingAmountError &&
            formData.recipient &&
            formData.paymentAmount &&
            formData.intervalDuration &&
            formData.startTime &&
            formData.fundingAmount
        )
    }

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateAllFields()) {
            return
        }

        if (!address || isCreatingPlan) return

        // Convert values for smart contract
        const paymentAmountWei = convertToWei(formData.paymentAmount, formData.paymentUnit)
        const fundingAmountWei = convertToWei(formData.fundingAmount, formData.fundingUnit)
        const intervalSeconds = convertToSeconds(formData.intervalDuration, formData.intervalUnit)
        const startTimeUnix = Math.floor(new Date(formData.startTime).getTime() / 1000)

        setStatus("Creating recurring payment plan...")

        try {
            setIsCreatingPlan(true)

            const { result: createPlanHash, status: createPlanStatus } = await executeWrite({
                contract: contractType.RecurringPaymentFactory,
                functionName: "createPlan",
                args: [formData.recipient, paymentAmountWei, intervalSeconds, startTimeUnix],
                value: fundingAmountWei,
                onSuccess: (txnHash) => {
                    toast.success(`Transaction sent!`)
                    setStatus(`Txn hash: ${txnHash}`)
                },
            })

            if (!createPlanHash) {
                if (createPlanStatus && createPlanStatus.includes("User denied the transaction.")) return

                toast.error(createPlanStatus || "Transaction failed")
                setStatus("Transaction failed")
                return
            }

            await waitForTransactionReceipt(wagmiConfig, { hash: createPlanHash })
            toast.success("Recurring payment plan created successfully!")
        } catch (err) {
            console.log("Error creating plan:", err)
            toast.error("Failed to create inheritance plan")
        } finally {
            setIsCreatingPlan(false)
            setStatus("")
        }
    }

    return (
        <TooltipProvider>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Create a Recurring Payment Plan</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        This Dapp lets you schedule automatic recurring payments to any wallet address using Rootstock.
                        Specify an amount, time interval, and funding.
                    </p>
                </div>

                {/* Payment Plan Form */}
                <Card className="w-full plan-card">
                    <CardHeader className="pb-3 pt-3 plan-card-header">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Payment Plan Configuration
                        </CardTitle>
                        <CardDescription>Configure your recurring payment schedule and funding details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreatePlan} className="space-y-6">
                            {/* Recipient Section */}
                            <div className="space-y-2 border-t pt-6">
                                <Label htmlFor="recipient" className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Recipient Wallet Address
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground tooltip-trigger" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>The Rootstock wallet address that will receive the recurring payments</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Input
                                    id="recipient"
                                    placeholder="0x..."
                                    value={formData.recipient}
                                    onChange={(e) => handleRecipientChange(e.target.value)}
                                    onBlur={(e) => handleRecipientChange(e.target.value)}
                                    className={recipientError ? "border-destructive" : ""}
                                />
                                {recipientError && <p className="text-destructive text-xs mt-1">{recipientError}</p>}
                            </div>

                            {/* Payment Amount Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentAmount" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Payment Amount per Interval
                                    </Label>
                                    <Input
                                        id="paymentAmount"
                                        type="number"
                                        step="any"
                                        placeholder="100"
                                        value={formData.paymentAmount}
                                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                                        onBlur={(e) => handlePaymentAmountChange(e.target.value)}
                                        className={paymentAmountError ? "border-destructive" : ""}
                                    />
                                    {paymentAmountError && (
                                        <p className="text-destructive text-xs mt-1">{paymentAmountError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentUnit">Unit</Label>
                                    <Select
                                        value={formData.paymentUnit}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, paymentUnit: value as any }))
                                        }
                                    >
                                        <SelectTrigger id="paymentUnit">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wei">Wei</SelectItem>
                                            <SelectItem value="gwei">Gwei</SelectItem>
                                            <SelectItem value="eth">RBTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Interval Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="intervalDuration" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Interval Between Payments
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground tooltip-trigger" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Minimum interval is 60 seconds</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>
                                    <Input
                                        id="intervalDuration"
                                        type="number"
                                        step="any"
                                        placeholder="60"
                                        value={formData.intervalDuration}
                                        onChange={(e) => handleIntervalDurationChange(e.target.value)}
                                        onBlur={(e) => handleIntervalDurationChange(e.target.value)}
                                        className={intervalDurationError ? "border-destructive" : ""}
                                    />
                                    {intervalDurationError && (
                                        <p className="text-destructive text-xs mt-1">{intervalDurationError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="intervalUnit">Time Unit</Label>
                                    <Select value={formData.intervalUnit} onValueChange={handleIntervalUnitChange}>
                                        <SelectTrigger id="intervalUnit">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="seconds">Seconds</SelectItem>
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="weeks">Weeks</SelectItem>
                                            <SelectItem value="months">Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Start Time Section */}
                            <div className="space-y-2">
                                <Label htmlFor="startTime" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Time
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground tooltip-trigger" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>When the first payment should be made (must be in the future)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Input
                                    id="startTime"
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => handleStartTimeChange(e.target.value)}
                                    onBlur={(e) => handleStartTimeChange(e.target.value)}
                                    className={startTimeError ? "border-destructive" : ""}
                                />
                                {startTimeError && <p className="text-destructive text-xs mt-1">{startTimeError}</p>}
                            </div>

                            {/* Funding Amount Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fundingAmount" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Initial Funding Amount
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground tooltip-trigger" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Amount to deposit into the payment plan contract</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>
                                    <Input
                                        id="fundingAmount"
                                        type="number"
                                        step="any"
                                        placeholder="500"
                                        value={formData.fundingAmount}
                                        onChange={(e) => handleFundingAmountChange(e.target.value)}
                                        onBlur={(e) => handleFundingAmountChange(e.target.value)}
                                        className={fundingAmountError ? "border-destructive" : ""}
                                    />
                                    {fundingAmountError && (
                                        <p className="text-destructive text-xs mt-1">{fundingAmountError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fundingUnit">Unit</Label>
                                    <Select
                                        value={formData.fundingUnit}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, fundingUnit: value as any }))
                                        }
                                    >
                                        <SelectTrigger id="fundingUnit">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wei">Wei</SelectItem>
                                            <SelectItem value="gwei">Gwei</SelectItem>
                                            <SelectItem value="eth">RBTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <div className="flex items-start space-x-3">
                                        <Info className="h-5 w-5 text-cyan-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-foreground">{status}</h4>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                                    disabled={!isFormValid() || isCreatingPlan}
                                >
                                    {isCreatingPlan && (
                                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    )}
                                    Create Plan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    )
}
