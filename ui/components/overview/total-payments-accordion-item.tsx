"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TrendingUp } from "lucide-react"
import { formatWeiAmount } from "@/lib/utils"
import { usePaymentTotals } from "@/hooks/usePaymentTotals"
import { Spinner } from "@/components/ui/spinner"

export default function TotalPaymentsAccordionItem() {
    const { data, isLoading, isError } = usePaymentTotals()

    const [totalAmount, setTotalAmount] = useState<{ value: string; unit: string } | null>(null)
    const [totalCount, setTotalCount] = useState<number | null>(null)

    useEffect(() => {
        if (!isLoading && data && !isError) {
            setTotalAmount(formatWeiAmount(data.sum?.amount ?? "0"))
            setTotalCount(data.count)
        }
    }, [data, isLoading, isError])

    // Error
    if (isError) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-red-500">Error Loading Summary</h1>
                    <p className="text-muted-foreground">
                        There was a problem loading your payment summary. Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    return (
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
                                <div className="text-2xl font-bold text-cyan-700 mb-2">
                                    {isLoading ? (
                                        <Spinner className="mx-auto h-6 w-6 text-cyan-700" />
                                    ) : (
                                        `${totalAmount?.value ?? "-"} ${totalAmount?.unit ?? ""}`
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Payment Amount (All-Time)</div>
                            </div>
                            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-700 mb-2">
                                    {isLoading ? (
                                        <Spinner className="mx-auto h-6 w-6 text-green-700" />
                                    ) : (
                                        totalCount ?? "-"
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Number of Payments (All-Time)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
    )
}
