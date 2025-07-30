"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Filter, CalendarIcon, TrendingUp, Activity, Wallet, Copy, X } from "lucide-react"
import { formatWeiAmount, formatTimestamp, abbreviateAddress, copyToClipboard } from "@/lib/utils"
import { toast } from "sonner"

import { usePaymentTotals } from "@/hooks/usePaymentTotals"
import { graphqlClient } from "@/lib/graphql/client"
import { GET_PLANS_BY_PAYER, GET_PAYMENT_DETAILS_BY_PLAN } from "@/lib/graphql/queries"

// Mock data
const paymentSummary = {
    totalAmount: "5620000000000000000", // in wei
    totalCount: 27,
}

const payments = [
    {
        planAddress: "0xAbC1234567890000000000000000000000000001",
        amount: "250000000000000000", // wei
        recipient: "0xDeF9876543210000000000000000000000000002",
        timestamp: 1753265526,
    },
    {
        planAddress: "0xAbC4567890000000000000000000000000000003",
        amount: "1100000000000000",
        recipient: "0xBaaed1234560000000000000000000000000001",
        timestamp: 1753267890,
    },
    {
        planAddress: "0xAbC1234567890000000000000000000000000001",
        amount: "500000000000000000",
        recipient: "0xDeF9876543210000000000000000000000000002",
        timestamp: 1753270000,
    },
    {
        planAddress: "0xDef7890123456789000000000000000000000004",
        amount: "750000000000000000",
        recipient: "0xCcc1111111111111111111111111111111111111",
        timestamp: 1753272000,
    },
    {
        planAddress: "0xAbC4567890000000000000000000000000000003",
        amount: "2200000000000000",
        recipient: "0xBaaed1234560000000000000000000000000001",
        timestamp: 1753274000,
    },
    {
        planAddress: "0xGhi5678901234567890000000000000000000005",
        amount: "1000000000000000000",
        recipient: "0xDdd2222222222222222222222222222222222222",
        timestamp: 1753276000,
    },
    {
        planAddress: "0xAbC1234567890000000000000000000000000001",
        amount: "300000000000000000",
        recipient: "0xDeF9876543210000000000000000000000000002",
        timestamp: 1753278000,
    },
    {
        planAddress: "0xJkl6789012345678901000000000000000000006",
        amount: "850000000000000000",
        recipient: "0xEee3333333333333333333333333333333333333",
        timestamp: 1753280000,
    },
]

const fundingEvents = [
    {
        plan: "0xAbC1234567890000000000000000000000000001",
        amount: "1000000000000000000", // wei
        payer: "0xUser0000000000000000000000000000000000001",
        timestamp: 1753269999,
    },
    {
        plan: "0xAbC4567890000000000000000000000000000003",
        amount: "500000000000000000",
        payer: "0xAnotherUser000000000000000000000000000002",
        timestamp: 1753271000,
    },
    {
        plan: "0xDef7890123456789000000000000000000000004",
        amount: "2000000000000000000",
        payer: "0xUser0000000000000000000000000000000000001",
        timestamp: 1753273000,
    },
    {
        plan: "0xGhi5678901234567890000000000000000000005",
        amount: "1500000000000000000",
        payer: "0xFunder111111111111111111111111111111111111",
        timestamp: 1753275000,
    },
    {
        plan: "0xAbC1234567890000000000000000000000000001",
        amount: "750000000000000000",
        payer: "0xAnotherUser000000000000000000000000000002",
        timestamp: 1753277000,
    },
    {
        plan: "0xJkl6789012345678901000000000000000000006",
        amount: "1200000000000000000",
        payer: "0xFunder222222222222222222222222222222222222",
        timestamp: 1753279000,
    },
    {
        plan: "0xAbC4567890000000000000000000000000000003",
        amount: "800000000000000000",
        payer: "0xUser0000000000000000000000000000000000001",
        timestamp: 1753281000,
    },
    {
        plan: "0xMno7890123456789012000000000000000000007",
        amount: "950000000000000000",
        payer: "0xFunder333333333333333333333333333333333333",
        timestamp: 1753283000,
    },
]

type SortField = "planAddress" | "amount" | "recipient" | "timestamp" | "plan" | "payer"
type SortDirection = "asc" | "desc"

export default function PaymentOverviewPage() {
    const { data: totals, isLoading, isError } = usePaymentTotals()

    // Payment history state
    const [paymentSortField, setPaymentSortField] = useState<SortField>("timestamp")
    const [paymentSortDirection, setPaymentSortDirection] = useState<SortDirection>("desc")
    const [selectedPlans, setSelectedPlans] = useState<string[]>([])
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null,
    })

    // Funding history state
    const [fundingSortField, setFundingSortField] = useState<SortField>("timestamp")
    const [fundingSortDirection, setFundingSortDirection] = useState<SortDirection>("desc")

    // UI state
    const [planFilterOpen, setPlanFilterOpen] = useState(false)
    const [recipientFilterOpen, setRecipientFilterOpen] = useState(false)
    const [startDateOpen, setStartDateOpen] = useState(false)
    const [endDateOpen, setEndDateOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && totals && !isError) {
            //setPlans(paymentPlans)
            console.log("Totals: ", totals?.sum?.amount, totals?.count)
        }
    }, [isLoading, isError, totals])

    // Extract unique values for filters
    const planAddresses = useMemo(() => [...new Set(payments.map((p) => p.planAddress))], [])
    const recipientAddresses = useMemo(() => [...new Set(payments.map((p) => p.recipient))], [])

    // Sorting functions
    const handlePaymentSort = (field: SortField) => {
        if (paymentSortField === field) {
            setPaymentSortDirection(paymentSortDirection === "asc" ? "desc" : "asc")
        } else {
            setPaymentSortField(field)
            setPaymentSortDirection("asc")
        }
    }

    const handleFundingSort = (field: SortField) => {
        if (fundingSortField === field) {
            setFundingSortDirection(fundingSortDirection === "asc" ? "desc" : "asc")
        } else {
            setFundingSortField(field)
            setFundingSortDirection("asc")
        }
    }

    // Filter and sort payments
    const filteredAndSortedPayments = useMemo(() => {
        const filtered = payments.filter((payment) => {
            // Plan filter
            if (selectedPlans.length > 0 && !selectedPlans.includes(payment.planAddress)) {
                return false
            }

            // Recipient filter
            if (selectedRecipients.length > 0 && !selectedRecipients.includes(payment.recipient)) {
                return false
            }

            // Date range filter
            if (dateRange.start || dateRange.end) {
                const paymentDate = new Date(payment.timestamp * 1000)
                if (dateRange.start && paymentDate < dateRange.start) return false
                if (dateRange.end && paymentDate > dateRange.end) return false
            }

            return true
        })

        // Sort
        filtered.sort((a, b) => {
            let aValue: any = a[paymentSortField as keyof typeof a]
            let bValue: any = b[paymentSortField as keyof typeof b]

            if (paymentSortField === "amount") {
                aValue = BigInt(aValue)
                bValue = BigInt(bValue)
                return paymentSortDirection === "asc" ? (aValue < bValue ? -1 : 1) : aValue > bValue ? -1 : 1
            }

            if (typeof aValue === "string") {
                return paymentSortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            }

            return paymentSortDirection === "asc" ? aValue - bValue : bValue - aValue
        })

        return filtered
    }, [payments, selectedPlans, selectedRecipients, dateRange, paymentSortField, paymentSortDirection])

    // Sort funding events
    const sortedFundingEvents = useMemo(() => {
        return [...fundingEvents].sort((a, b) => {
            let aValue: any = a[fundingSortField as keyof typeof a]
            let bValue: any = b[fundingSortField as keyof typeof b]

            if (fundingSortField === "amount") {
                aValue = BigInt(aValue)
                bValue = BigInt(bValue)
                return fundingSortDirection === "asc" ? (aValue < bValue ? -1 : 1) : aValue > bValue ? -1 : 1
            }

            if (typeof aValue === "string") {
                return fundingSortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            }

            return fundingSortDirection === "asc" ? aValue - bValue : bValue - aValue
        })
    }, [fundingEvents, fundingSortField, fundingSortDirection])

    // Filter handlers
    const handlePlanSelection = (planAddress: string, checked: boolean) => {
        if (checked) {
            setSelectedPlans([...selectedPlans, planAddress])
        } else {
            setSelectedPlans(selectedPlans.filter((p) => p !== planAddress))
        }
    }

    const handleRecipientSelection = (recipient: string, checked: boolean) => {
        if (checked) {
            setSelectedRecipients([...selectedRecipients, recipient])
        } else {
            setSelectedRecipients(selectedRecipients.filter((r) => r !== recipient))
        }
    }

    const handleSelectAllPlans = () => {
        if (selectedPlans.length === planAddresses.length) {
            setSelectedPlans([])
        } else {
            setSelectedPlans([...planAddresses])
        }
    }

    const handleSelectAllRecipients = () => {
        if (selectedRecipients.length === recipientAddresses.length) {
            setSelectedRecipients([])
        } else {
            setSelectedRecipients([...recipientAddresses])
        }
    }

    const clearFilters = () => {
        setSelectedPlans([])
        setSelectedRecipients([])
        setDateRange({ start: null, end: null })
    }

    const SortIcon = ({
        field,
        currentField,
        direction,
    }: {
        field: string
        currentField: string
        direction: string
    }) => {
        if (field !== currentField) return <ChevronDown className="h-4 w-4 opacity-50" />
        return direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }

    const totalAmountFormatted = formatWeiAmount(paymentSummary.totalAmount)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">Payment Overview</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    View your payment history, funding activity, and plan-level details in one place.
                </p>
            </div>

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["summary", "payments", "funding"]} className="space-y-4">
                {/* Section 1: Summary Overview */}
                <AccordionItem value="summary" className="border rounded-lg">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-cyan-600" />
                            <span className="text-lg font-semibold">Payment Summary</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                        <Card className="border-0 shadow-none plan-card">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                                        <div className="text-3xl font-bold text-cyan-700 mb-2">
                                            {totalAmountFormatted.value} {totalAmountFormatted.unit}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Total Payment Amount (All-Time)
                                        </div>
                                    </div>
                                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <div className="text-3xl font-bold text-green-700 mb-2">
                                            {paymentSummary.totalCount}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Total Number of Payments (All-Time)
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                {/* Section 2: Payment History */}
                <AccordionItem value="payments" className="border rounded-lg">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-cyan-600" />
                            <span className="text-lg font-semibold">Payment History</span>
                            <Badge variant="secondary" className="ml-2">
                                {filteredAndSortedPayments.length}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                        <Card className="border-0 shadow-none plan-card">
                            <CardContent className="p-6">
                                {/* Filters */}
                                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Filters:</span>
                                    </div>

                                    {/* Plan Filter */}
                                    <Popover open={planFilterOpen} onOpenChange={setPlanFilterOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                                Plans {selectedPlans.length > 0 && `(${selectedPlans.length})`}
                                                <ChevronDown className="h-3 w-3 ml-1" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="start">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Filter by Plans</h4>
                                                    <Button variant="ghost" size="sm" onClick={handleSelectAllPlans}>
                                                        {selectedPlans.length === planAddresses.length
                                                            ? "Unselect All"
                                                            : "Select All"}
                                                    </Button>
                                                </div>
                                                <Separator />
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {planAddresses.map((address) => (
                                                        <div key={address} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`plan-${address}`}
                                                                checked={selectedPlans.includes(address)}
                                                                onCheckedChange={(checked) =>
                                                                    handlePlanSelection(address, checked as boolean)
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`plan-${address}`}
                                                                className="text-sm font-mono"
                                                            >
                                                                {abbreviateAddress(address)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Recipient Filter */}
                                    <Popover open={recipientFilterOpen} onOpenChange={setRecipientFilterOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                                Recipients{" "}
                                                {selectedRecipients.length > 0 && `(${selectedRecipients.length})`}
                                                <ChevronDown className="h-3 w-3 ml-1" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="start">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Filter by Recipients</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleSelectAllRecipients}
                                                    >
                                                        {selectedRecipients.length === recipientAddresses.length
                                                            ? "Unselect All"
                                                            : "Select All"}
                                                    </Button>
                                                </div>
                                                <Separator />
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {recipientAddresses.map((address) => (
                                                        <div key={address} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`recipient-${address}`}
                                                                checked={selectedRecipients.includes(address)}
                                                                onCheckedChange={(checked) =>
                                                                    handleRecipientSelection(
                                                                        address,
                                                                        checked as boolean
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`recipient-${address}`}
                                                                className="text-sm font-mono"
                                                            >
                                                                {abbreviateAddress(address)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Date Range Filter */}
                                    <div className="flex items-center gap-2">
                                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                    {dateRange.start
                                                        ? dateRange.start.toLocaleDateString()
                                                        : "Start Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateRange.start || undefined}
                                                    onSelect={(date) =>
                                                        setDateRange((prev) => ({ ...prev, start: date || null }))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                    {dateRange.end ? dateRange.end.toLocaleDateString() : "End Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateRange.end || undefined}
                                                    onSelect={(date) =>
                                                        setDateRange((prev) => ({ ...prev, end: date || null }))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Clear Filters */}
                                    {(selectedPlans.length > 0 ||
                                        selectedRecipients.length > 0 ||
                                        dateRange.start ||
                                        dateRange.end) && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                                            <X className="h-3 w-3 mr-1" />
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                {/* Payment Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePaymentSort("planAddress")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Plan Address
                                                        <SortIcon
                                                            field="planAddress"
                                                            currentField={paymentSortField}
                                                            direction={paymentSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePaymentSort("amount")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Amount
                                                        <SortIcon
                                                            field="amount"
                                                            currentField={paymentSortField}
                                                            direction={paymentSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePaymentSort("recipient")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Recipient
                                                        <SortIcon
                                                            field="recipient"
                                                            currentField={paymentSortField}
                                                            direction={paymentSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePaymentSort("timestamp")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Date & Time
                                                        <SortIcon
                                                            field="timestamp"
                                                            currentField={paymentSortField}
                                                            direction={paymentSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAndSortedPayments.map((payment, index) => {
                                                const amountFormatted = formatWeiAmount(payment.amount)
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {abbreviateAddress(payment.planAddress)}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(payment.planAddress)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {amountFormatted.value} {amountFormatted.unit}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {abbreviateAddress(payment.recipient)}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(payment.recipient)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatTimestamp(payment.timestamp)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredAndSortedPayments.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No payments found matching the current filters.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                {/* Section 3: Funding History */}
                <AccordionItem value="funding" className="border rounded-lg">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-cyan-600" />
                            <span className="text-lg font-semibold">Plan Funding Activity</span>
                            <Badge variant="secondary" className="ml-2">
                                {fundingEvents.length}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                        <Card className="border-0 shadow-none plan-card">
                            <CardContent className="p-6">
                                {/* Funding Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFundingSort("plan")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Funded Plan Address
                                                        <SortIcon
                                                            field="plan"
                                                            currentField={fundingSortField}
                                                            direction={fundingSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFundingSort("amount")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Funding Amount
                                                        <SortIcon
                                                            field="amount"
                                                            currentField={fundingSortField}
                                                            direction={fundingSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFundingSort("payer")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Funder Address
                                                        <SortIcon
                                                            field="payer"
                                                            currentField={fundingSortField}
                                                            direction={fundingSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFundingSort("timestamp")}
                                                        className="h-8 p-0 font-medium"
                                                    >
                                                        Date & Time
                                                        <SortIcon
                                                            field="timestamp"
                                                            currentField={fundingSortField}
                                                            direction={fundingSortDirection}
                                                        />
                                                    </Button>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedFundingEvents.map((funding, index) => {
                                                const amountFormatted = formatWeiAmount(funding.amount)
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {abbreviateAddress(funding.plan)}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(funding.plan)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-green-600">
                                                            {amountFormatted.value} {amountFormatted.unit}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {abbreviateAddress(funding.payer)}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(funding.payer)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatTimestamp(funding.timestamp)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
