"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Copy } from "lucide-react"
import { formatWeiAmount, formatTimestamp, abbreviateAddress, copyToClipboard } from "@/lib/utils"
import { SortIcon } from "@/components/common/sort-icon"
import { useFundingDetails } from "@/hooks/useFundingDetails"
import { Spinner } from "@/components/ui/spinner"

interface FundingEvent {
    plan: string
    amount: string
    payer: string
    timestamp: number | null
    title: string
}

type SortField = "plan" | "amount" | "payer" | "timestamp"
type SortDirection = "asc" | "desc"

export default function FundingHistoryAccordionItem() {
    const { data: rawFundingEvents, isLoading, isError } = useFundingDetails()

    // State
    const [sortField, setSortField] = useState<SortField>("timestamp")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [fundingEvents, setFundingEvents] = useState<FundingEvent[]>([])

    useEffect(() => {
        if (!isLoading && rawFundingEvents && !isError) {
            //console.log("Data: ", rawFundingEvents)
            setFundingEvents(rawFundingEvents)
        }
    }, [rawFundingEvents, isLoading, isError])

    // Sorting function
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    // Sort funding events
    const sortedFundingEvents = useMemo(() => {
        return [...fundingEvents].sort((a, b) => {
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
    }, [fundingEvents, sortField, sortDirection])

    if (isError) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-red-500">Error Loading Funding Activity</h1>
                    <p className="text-muted-foreground">
                        There was a problem loading your funding history. Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    return (
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
                                                    Funded Plan
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
                                                    Funding Amount
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
                                                    onClick={() => handleSort("payer")}
                                                    className="h-8 p-0 font-medium"
                                                >
                                                    Funder Address
                                                    <SortIcon
                                                        field="payer"
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
                                        {sortedFundingEvents.map((funding, index) => {
                                            const amountFormatted = formatWeiAmount(funding.amount)
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{funding.title}</span>
                                                            <code className="hidden sm:inline text-xs bg-muted px-2 py-1 rounded">
                                                                {abbreviateAddress(funding.plan)}
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyToClipboard(funding.plan)}
                                                                className="hidden sm:inline-flex h-6 w-6 p-0"
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
                                                    <TableCell>{formatTimestamp(funding.timestamp ?? 0)}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
    )
}
