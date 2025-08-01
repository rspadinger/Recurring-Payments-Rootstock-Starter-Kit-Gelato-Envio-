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

const MessageBlock = ({
    title,
    message,
    isLoading = false,
    isError = false,
}: {
    title: string
    message: string
    isLoading?: boolean
    isError?: boolean
}) => (
    <div className="app-background container mx-auto px-4 py-8 md:py-12">
        <div className="text-center max-w-2xl mx-auto">
            {isLoading && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-6"></div>
            )}
            <h1 className={`text-3xl font-bold mb-4 ${isError ? "text-red-500" : "text-foreground"}`}>{title}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{message}</p>
        </div>
    </div>
)

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
    if (!ready)
        return (
            <MessageBlock
                title="Setting Things Up..."
                message="We're securely initializing your session and preparing your recurring payment dashboard."
                isLoading
            />
        )

    if (!authenticated)
        return (
            <MessageBlock
                title="Automate Your Crypto Payments"
                message="Create and manage recurring payment plans on-chain. Send scheduled crypto payments to anyone, effortlessly and securely. Connect your wallet to get started and take full control of your recurring transactions."
            />
        )

    if (!address)
        return (
            <MessageBlock
                title="Wallet Not Connected"
                message="Please connect your crypto wallet to continue. You need an active wallet connection to view and manage your recurring payment plans."
            />
        )

    if (isLoading) return <MessageBlock title={loadingTitle} message={loadingMessage} isLoading />

    if (isError) return <MessageBlock title={errorTitle} message={errorMessage} isError />

    return null
}

export default PageState
