import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code } from "lucide-react"

export default function APIAccessPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                    <Code className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        API Access
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    API Access
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Integrate Instantly with your custom applications
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. Access our powerful API to build custom integrations and workflows.
                </p>
                <Link href="/documentation">
                    <Button className="mr-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                        View Documentation
                    </Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
