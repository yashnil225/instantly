import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function StatusPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        System Status
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Current operational status of Instantly services
                    </p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <div>
                            <h2 className="text-2xl font-bold">All Systems Operational</h2>
                            <p className="text-muted-foreground">All services are running normally</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Email Sending Service</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-600">Operational</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Email Tracking</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-600">Operational</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Analytics Dashboard</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-600">Operational</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">API Services</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-600">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <Link href="/">
                        <Button>Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
