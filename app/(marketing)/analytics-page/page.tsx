import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Analytics
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Powerful Email Analytics
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Deep insights into your email campaign performance
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. Track open rates, click rates, response rates, and more with our comprehensive analytics dashboard.
                </p>
                <Link href="/signup">
                    <Button className="mr-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                        Get Started
                    </Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
