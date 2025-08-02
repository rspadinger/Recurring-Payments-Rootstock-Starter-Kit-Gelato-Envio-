"use client"

import { usePrivy } from "@privy-io/react-auth"
// @ts-expect-error working fine
import { useAccount } from "wagmi"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import TotalPaymentsAccordionItem from "@/components/overview/total-payments-accordion-item"
import PaymentDetailsAccordionItem from "@/components/overview/payment-details-accordion-item"
import FundingHistoryAccordionItem from "@/components/overview/funding-history-accordion-item"
import PageState from "@/components/common/page-state"
import { usePaymentPlans } from "@/hooks/usePaymentPlans"
import { Wallet } from "lucide-react"

export default function PaymentOverviewPage() {
    const { authenticated, ready } = usePrivy()
    const { address } = useAccount()
    const { data: plans } = usePaymentPlans()

    const showFallback = <PageState ready={ready} authenticated={authenticated} address={address} />

    if (!ready || !authenticated || !address) {
        return showFallback
    }

    if (plans?.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="space-y-6">
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
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">Payment Overview</h1>
                <p className="hidden md:block text-lg text-muted-foreground max-w-3xl mx-auto">
                    View your payment history, funding activity, and plan-level details in one place.
                </p>
            </div>

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["summary", "payments", "funding"]} className="space-y-4">
                <TotalPaymentsAccordionItem />
                <PaymentDetailsAccordionItem addressColumn={"Recipient"} displayPayer={false} />
                <FundingHistoryAccordionItem />
            </Accordion>
        </div>
    )
}
