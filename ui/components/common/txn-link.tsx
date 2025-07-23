import { ExternalLink } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TransactionLinkProps {
    txHash: string
    network?: "sepolia" | "mainnet"
}

export default function TransactionLink({ txHash, network = "sepolia" }: TransactionLinkProps) {
    const baseUrl = `https://${network}.etherscan.io/tx/`
    const shortHash = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={`${baseUrl}${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <span className="mr-1">{shortHash}</span>
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </TooltipTrigger>
                <TooltipContent>
                    <p>View transaction on Etherscan</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
