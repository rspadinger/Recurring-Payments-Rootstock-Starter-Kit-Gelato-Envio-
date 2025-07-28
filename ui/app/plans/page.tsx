"use client"

import { useState } from "react"
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
} from "lucide-react"

import {
    formatWeiAmount,
    formatTimestamp,
    formatInterval,
    convertToSeconds,
    convertToWei,
    abbreviateAddress,
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
}

const mockPlans: PaymentPlan[] = [
    {
        planAddress: "0xAbC1234567890000000000000000000000000001",
        balance: "250000000000000000", // 0.25 ETH
        status: 0,
        recipient: "0xDeF9876543210000000000000000000000000002",
        numberOfPayments: 3,
        totalAmountOfPayment: "300000000000000", // 0.0003 ETH
        firstPayment: 1721223000,
        lastPayment: 1721226000,
        paymentInterval: 3600,
        paymentAmount: "100000000000000", // 0.0001 ETH
    },
    {
        planAddress: "0x1230000000000000000000000000000000009999",
        balance: "1000000000000000000", // 1 ETH
        status: 1,
        recipient: "0x8888888888888888888888888888888888888888",
        numberOfPayments: 5,
        totalAmountOfPayment: "500000000000000000", // 0.5 ETH
        firstPayment: 1721230000,
        lastPayment: 1721240000,
        paymentInterval: 86400,
        paymentAmount: "100000000000000000", // 0.1 ETH
    },
]

export default function PaymentPlansPage() {
    const [plans, setPlans] = useState<PaymentPlan[]>(mockPlans)
    const [editingInterval, setEditingInterval] = useState<string | null>(null)
    const [editingAmount, setEditingAmount] = useState<string | null>(null)
    const [intervalValues, setIntervalValues] = useState<Record<string, { duration: string; unit: string }>>({})
    const [amountValues, setAmountValues] = useState<Record<string, { amount: string; unit: string }>>({})

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

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success("Address copied to clipboard!")
        } catch (err) {
            toast.error("Failed to copy address")
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

    const saveIntervalChange = (planAddress: string) => {
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
        toast.success("Payment interval updated successfully!")
    }

    const saveAmountChange = (planAddress: string) => {
        const values = amountValues[planAddress]
        if (!values) return

        const amount = Number.parseFloat(values.amount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid payment amount")
            return
        }

        const weiAmount = convertToWei(values.amount, values.unit as "wei" | "gwei" | "eth")

        setPlans((prev) =>
            prev.map((plan) => (plan.planAddress === planAddress ? { ...plan, paymentAmount: weiAmount } : plan))
        )

        setEditingAmount(null)
        toast.success("Payment amount updated successfully!")
    }

    const cancelEdit = () => {
        setEditingInterval(null)
        setEditingAmount(null)
    }

    return (
        <TooltipProvider>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Your Recurring Payment Plans</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        View and manage your existing recurring payment plans. Update payment intervals, change payment
                        amounts, and monitor performance.
                    </p>
                </div>

                {/* Plans Listing */}
                <div className="space-y-6">
                    {plans.length === 0 ? (
                        <Card className="text-center py-12 empty-state-card">
                            <CardContent>
                                <div className="flex flex-col items-center space-y-4">
                                    <Wallet className="h-16 w-16 text-cyan-400" />
                                    <h3 className="text-xl font-semibold">No Payment Plans Yet</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        You haven't created any recurring payment plans yet.
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
                                    <CardHeader className="pb-0 plan-card-header">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="space-y-2">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Activity className="h-5 w-5 text-cyan-600" />
                                                    Payment Plan
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                                        {plan.planAddress}
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
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">Balance</p>
                                                    <p className="font-semibold text-cyan-700">
                                                        {balanceFormatted.value} {balanceFormatted.unit}
                                                    </p>
                                                </div>
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
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* Plan Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-6">
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
                                                        <Copy className="h-3 w-3" />
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

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Payment Interval */}
                                                    <div className="space-y-3">
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
                                                                <span className="text-sm">
                                                                    {intervalFormatted.value} {intervalFormatted.unit}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleIntervalEdit(plan.planAddress)}
                                                                >
                                                                    Change Interval
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Payment Amount */}
                                                    <div className="space-y-3">
                                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                                            <DollarSign className="h-4 w-4 text-cyan-600" />
                                                            Payment Amount
                                                        </Label>

                                                        {editingAmount === plan.planAddress ? (
                                                            <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        step="any"
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
                                                                            <SelectItem value="eth">ETH</SelectItem>
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
                                                                    onClick={() => handleAmountEdit(plan.planAddress)}
                                                                >
                                                                    Change Amount
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
