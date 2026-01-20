import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2 } from "lucide-react"

export default function EmailTrackingPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            Email Tracking
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Track Every Email Interaction
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Know exactly when your emails are opened, clicked, and read in real-time
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-card rounded-lg border border-border p-6">
                        <CheckCircle2 className="h-8 w-8 text-indigo-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
                        <p className="text-muted-foreground">
                            Get instant notifications when recipients open your emails
                        </p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-6">
                        <CheckCircle2 className="h-8 w-8 text-indigo-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Click Tracking</h3>
                        <p className="text-muted-foreground">
                            Monitor which links your recipients click on
                        </p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-6">
                        <CheckCircle2 className="h-8 w-8 text-indigo-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Read Receipts</h3>
                        <p className="text-muted-foreground">
                            Know when and how many times your emails are read
                        </p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-6">
                        <CheckCircle2 className="h-8 w-8 text-indigo-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Device Detection</h3>
                        <p className="text-muted-foreground">
                            See what devices your recipients use to read emails
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/signup">
                        <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white mr-4">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button size="lg" variant="outline">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
