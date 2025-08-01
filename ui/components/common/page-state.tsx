// components/PageState.tsx
import React from "react"

interface PageStateProps {
    ready: boolean
    authenticated: boolean
    address?: string
    isLoading?: boolean
    isError?: boolean
    loadingTitle?: string
    loadingMessage?: string
    errorTitle?: string
    errorMessage?: string
}

const PageState: React.FC<PageStateProps> = ({
    ready,
    authenticated,
    address,
    isLoading,
    isError,
    loadingTitle = "Loading...",
    loadingMessage = "Loading your data, please wait.",
    errorTitle = "Error",
    errorMessage = "An error occurred. Please try again later.",
}) => {
    // Privy not ready
    if (!ready) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-6"></div>
                    <h1 className="text-3xl font-bold mb-4">Setting Things Up...</h1>
                    <p className="text-muted-foreground">
                        We're securely initializing your session and preparing your recurring payment dashboard.
                    </p>
                </div>
            </div>
        )
    }

    // Not authenticated
    if (!authenticated) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Automate Your Crypto Payments</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Create and manage recurring payment plans on-chain. Send scheduled crypto payments to anyone,
                        effortlessly and securely. Connect your wallet to get started and take full control of your
                        recurring transactions.
                    </p>
                </div>
            </div>
        )
    }

    // Address not yet available
    if (!address) {
        // Wallet not connected
        if (!address) {
            return (
                <div className="app-background container mx-auto px-4 py-8 md:py-12">
                    <div className="text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-bold text-foreground mb-4">Wallet Not Connected</h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Please connect your crypto wallet to continue. You need an active wallet connection to view
                            and manage your recurring payment plans.
                        </p>
                    </div>
                </div>
            )
        }
    }

    // Loading
    if (isLoading) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-6"></div>
                    <h1 className="text-3xl font-bold mb-4">{loadingTitle}</h1>
                    <p className="text-muted-foreground">{loadingMessage}</p>
                </div>
            </div>
        )
    }

    // Error
    if (isError) {
        return (
            <div className="app-background container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-red-500">{errorTitle}</h1>
                    <p className="text-muted-foreground">{errorMessage}</p>
                </div>
            </div>
        )
    }

    return null
}

export default PageState
