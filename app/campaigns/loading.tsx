
import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[9999]">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="relative">
                    {/* Blue Lightning Icon */}
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500 fill-blue-500 animate-pulse">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                </div>

                <h2 className="text-gray-400 text-sm font-medium tracking-wide">
                    Loading your dashboard
                </h2>
            </div>
        </div>
    )
}
