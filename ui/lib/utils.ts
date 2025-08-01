//function cn that combines and merges CSS class names => used in all TailwindCSS projects
//Cleaner Code: You can pass conditional class names without manually resolving conflicts.
//Handles Conflicts: Automatically resolves conflicting TailwindCSS classes.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge" //merge conflicting TailwindCSS classes (e.g., p-2 and p-4 → resolves to p-4
import { toast } from "sonner"
import { ChevronDown, ChevronUp } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Utility functions for the payment plans
export const formatWeiAmount = (weiAmount: string | null | undefined): { value: string; unit: string } => {
    if (!weiAmount) {
        return { value: "0", unit: "eth" } // or whatever default you prefer
    }

    const wei = BigInt(weiAmount)
    const gwei = Number(wei) / 1e9
    const eth = Number(wei) / 1e18

    if (eth >= 0.001) {
        return { value: eth.toFixed(4), unit: "RBTC" }
    } else if (gwei >= 1) {
        return { value: gwei.toFixed(2), unit: "Gwei" }
    } else {
        return { value: weiAmount, unit: "Wei" }
    }
}

export const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    // "en-US"
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

export const formatInterval = (seconds: number): { value: number; unit: string } => {
    const intervals = [
        { unit: "months", seconds: 2592000 },
        { unit: "weeks", seconds: 604800 },
        { unit: "days", seconds: 86400 },
        { unit: "hours", seconds: 3600 },
        { unit: "minutes", seconds: 60 },
        { unit: "seconds", seconds: 1 },
    ]

    for (const interval of intervals) {
        if (seconds >= interval.seconds && seconds % interval.seconds === 0) {
            return { value: seconds / interval.seconds, unit: interval.unit }
        }
    }

    return { value: seconds, unit: "seconds" }
}

export const convertToSeconds = (duration: string, unit: string): number => {
    const num = Number.parseFloat(duration)
    if (isNaN(num)) return 0

    const multipliers = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400,
        weeks: 604800,
        months: 2592000, // 30 days
    }

    return num * multipliers[unit as keyof typeof multipliers]
}

export const convertToWei = (amount: string, unit: "wei" | "gwei" | "eth"): string => {
    const num = Number.parseFloat(amount)
    if (isNaN(num)) return "0"

    switch (unit) {
        case "wei":
            return Math.floor(num).toString()
        case "gwei":
            return Math.floor(num * 1e9).toString()
        case "eth":
            return Math.floor(num * 1e18).toString()
        default:
            return "0"
    }
}

export const abbreviateAddress = (address?: string): string => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    } catch (err) {
        toast.error("Failed to copy")
    }
}
