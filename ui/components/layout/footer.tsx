import Link from "next/link"
import { Github, Twitter, DiscIcon as Discord } from "lucide-react"

export default function Footer() {
    return (
        <footer>
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center py-6">
                <div className="flex space-x-6 mb-4 md:mb-0">
                    <Link href="/terms" className="text-sm text-slate-600 hover:text-cyan-600 transition-colors">
                        Terms
                    </Link>
                    <Link href="/privacy" className="text-sm text-slate-600 hover:text-cyan-600 transition-colors">
                        Privacy
                    </Link>
                    <Link href="/docs" className="text-sm text-slate-600 hover:text-cyan-600 transition-colors">
                        Docs
                    </Link>
                </div>
                <div className="flex space-x-4">
                    <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <Twitter className="h-5 w-5 text-slate-600 hover:text-cyan-600 transition-colors" />
                    </Link>
                    <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <Github className="h-5 w-5 text-slate-600 hover:text-cyan-600 transition-colors" />
                    </Link>
                    <Link href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                        <Discord className="h-5 w-5 text-slate-600 hover:text-cyan-600 transition-colors" />
                    </Link>
                </div>
            </div>
        </footer>
    )
}
