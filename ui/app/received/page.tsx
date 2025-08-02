"use client"

import { usePrivy } from "@privy-io/react-auth"
// @ts-expect-error working fine
import { useAccount } from "wagmi"

import { Accordion } from "@/components/ui/accordion"
import PaymentDetailsAccordionItem from "@/components/overview/payment-details-accordion-item"
import PageState from "@/components/common/page-state"

export default function PaymentOverviewPage() {
    const { authenticated, ready } = usePrivy()
    const { address } = useAccount()

    const showFallback = <PageState ready={ready} authenticated={authenticated} address={address} />

    if (!ready || !authenticated || !address) {
        return showFallback
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">Received Payments</h1>
                <p className="hidden md:block text-lg text-muted-foreground max-w-3xl mx-auto">
                    Track all incoming payments from your active plans.
                </p>
            </div>

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["summary", "payments", "funding"]} className="space-y-4">
                <PaymentDetailsAccordionItem addressColumn={"Payer"} displayPayer={true} />
            </Accordion>
        </div>
    )
}
