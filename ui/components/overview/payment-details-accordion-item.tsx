"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Filter, CalendarIcon, Activity, Copy, X } from "lucide-react"
import { formatWeiAmount, formatTimestamp, abbreviateAddress, copyToClipboard } from "@/lib/utils"
import { SortIcon } from "@/components/common/sort-icon"
import { usePaymentDetails } from "@/hooks/usePaymentDetails"
import { Spinner } from "@/components/ui/spinner"

interface Payment {
    plan: string
    amount: string
    recipient: string
    timestamp: number
    title: string
}

type SortField = "plan" | "amount" | "recipient" | "timestamp"
type SortDirection = "asc" | "desc"

export default function PaymentDetailsAccordionItem({ addressColumn = "Recipient", displayPayer }) {
    const { data: rawPayments, isLoading, isError } = usePaymentDetails(displayPayer)

    // State
    const [sortField, setSortField] = useState<SortField>("timestamp")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [selectedPlans, setSelectedPlans] = useState<string[]>([])
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null,
    })

    // UI state
    const [planFilterOpen, setPlanFilterOpen] = useState(false)
    const [recipientFilterOpen, setRecipientFilterOpen] = useState(false)
    const [startDateOpen, setStartDateOpen] = useState(false)
    const [endDateOpen, setEndDateOpen] = useState(false)

    const [payments, setPayments] = useState<Payment[]>([])

    useEffect(() => {
        if (!isLoading && rawPayments && !isError) {
            setPayments(rawPayments)
        }
    }, [rawPayments, isLoading, isError])

    // Extract unique values for filters
    const planes = useMemo(() => [...new Set(payments?.map((p) => p.plan))], [payments])
    const recipientAddresses = useMemo(() => [...new Set(payments?.map((p) => p.recipient))], [payments])

    // Sorting function
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    // Filter and sort payments
    const filteredAndSortedPayments = useMemo(() => {
        const filtered = payments?.filter((payment) => {
            // Plan filter
            if (selectedPlans.length > 0 && !selectedPlans.includes(payment.plan)) {
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
            let aValue: any = a[sortField as keyof typeof a]
            let bValue: any = b[sortField as keyof typeof b]

            if (sortField === "amount") {
                aValue = BigInt(aValue)
                bValue = BigInt(bValue)
                return sortDirection === "asc" ? (aValue < bValue ? -1 : 1) : aValue > bValue ? -1 : 1
            }

            if (typeof aValue === "string") {
                return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            }

            return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        })

        return filtered
    }, [payments, selectedPlans, selectedRecipients, dateRange, sortField, sortDirection])

    // Filter handlers
    const handlePlanSelection = (plan: string, checked: boolean) => {
        if (checked) {
            setSelectedPlans([...selectedPlans, plan])
        } else {
            setSelectedPlans(selectedPlans.filter((p) => p !== plan))
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
        if (selectedPlans.length === planes.length) {
            setSelectedPlans([])
        } else {
            setSelectedPlans([...planes])
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

    if (isError) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-red-500">Error Loading Payment History</h1>
                    <p className="text-muted-foreground">
                        There was a problem loading your payment history. Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    return (
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
                                                {selectedPlans.length === planes.length ? "Unselect All" : "Select All"}
                                            </Button>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {planes.map((address) => (
                                                <div key={address} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`plan-${address}`}
                                                        checked={selectedPlans.includes(address)}
                                                        onCheckedChange={(checked) =>
                                                            handlePlanSelection(address, checked as boolean)
                                                        }
                                                    />
                                                    <Label htmlFor={`plan-${address}`} className="text-sm font-mono">
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
                                        {addressColumn}
                                        {"s "}
                                        {selectedRecipients.length > 0 && `(${selectedRecipients.length})`}
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Filter by {addressColumn}s</h4>
                                            <Button variant="ghost" size="sm" onClick={handleSelectAllRecipients}>
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
                                                            handleRecipientSelection(address, checked as boolean)
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
                                            {dateRange.start ? dateRange.start.toLocaleDateString() : "Start Date"}
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
                        {isLoading ? (
                            <Spinner className="mx-auto h-6 w-6 text-green-700" />
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort("plan")}
                                                    className="h-8 p-0 font-medium"
                                                >
                                                    Payment Plan
                                                    <SortIcon
                                                        field="plan"
                                                        sortField={sortField}
                                                        sortDirection={sortDirection}
                                                    />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort("amount")}
                                                    className="h-8 p-0 font-medium"
                                                >
                                                    Amount
                                                    <SortIcon
                                                        field="amount"
                                                        sortField={sortField}
                                                        sortDirection={sortDirection}
                                                    />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort("recipient")}
                                                    className="h-8 p-0 font-medium"
                                                >
                                                    {addressColumn}
                                                    <SortIcon
                                                        field="recipient"
                                                        sortField={sortField}
                                                        sortDirection={sortDirection}
                                                    />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort("timestamp")}
                                                    className="h-8 p-0 font-medium"
                                                >
                                                    Date & Time
                                                    <SortIcon
                                                        field="timestamp"
                                                        sortField={sortField}
                                                        sortDirection={sortDirection}
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
                                                            <span className="text-sm font-medium">{payment.title}</span>
                                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                {abbreviateAddress(payment.plan)}
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyToClipboard(payment.plan)}
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
                        )}

                        {filteredAndSortedPayments.length === 0 && !isLoading && (
                            <div className="text-center py-8 text-muted-foreground">
                                No payments found matching the current filters.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
    )
}
