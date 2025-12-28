
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, CreditCard, Download, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function BillingPage() {
    const { data: session, status } = useSession()
    const { toast } = useToast()
    const [leadCount, setLeadCount] = useState<number | null>(null)
    const [currentPlan, setCurrentPlan] = useState<string>("trial")
    const [planLoading, setPlanLoading] = useState(true)

    useEffect(() => {
        const fetchBillingData = async () => {
            try {
                const [leadsRes, billingRes] = await Promise.all([
                    fetch('/api/stats/leads-count'),
                    fetch('/api/user/billing')
                ])

                if (leadsRes.ok) {
                    const data = await leadsRes.json()
                    setLeadCount(data.count)
                }

                if (billingRes.ok) {
                    const data = await billingRes.json()
                    setCurrentPlan(data.plan || "trial")
                }
            } catch (error) {
                console.error("Failed to load billing data:", error)
            } finally {
                setPlanLoading(false)
            }
        }
        fetchBillingData()
    }, [])

    const handleSwitchPlan = async (plan: string) => {
        try {
            const res = await fetch('/api/user/billing', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            })

            if (res.ok) {
                const data = await res.json()
                setCurrentPlan(data.plan)
                toast({ title: "Plan Updated", description: `You have successfully switched to the ${plan} plan.` })
            } else {
                toast({ title: "Error", description: "Failed to switch plan", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "An error occurred", variant: "destructive" })
        }
    }

    if (status === "unauthenticated") redirect("/login")

    return (
        <div className="max-w-6xl space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-white mb-2">Billing & Usage</h2>
                <p className="text-gray-400 text-sm">Manage your subscription, payment methods, and view invoices.</p>
            </div>

            {/* Current Usage Section */}
            <Card className="bg-[#111] border-[#222]">
                <CardHeader>
                    <CardTitle className="text-white">Current Usage</CardTitle>
                    <CardDescription>Your usage resets on Jan 19, 2026</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Emails Sent</span>
                            <span className="text-gray-400">0 / 100,000</span>
                        </div>
                        <Progress value={0} className="h-2 bg-[#222]" indicatorClassName="bg-blue-500" />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Active Leads</span>
                            <span className="text-gray-400">{leadCount?.toLocaleString() || '0'} / 1,000,000</span>
                        </div>
                        <Progress value={leadCount ? (leadCount / 1000000) * 100 : 0} className="h-2 bg-[#222]" indicatorClassName="bg-purple-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Plans Section */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Growth Plan */}
                <Card className={cn("bg-[#111] border-[#222] relative overflow-hidden", currentPlan === "growth" && "border-blue-500/50")}>
                    <CardHeader>
                        <CardTitle className="text-white">Growth</CardTitle>
                        <div className="text-3xl font-bold text-white mt-2">$37<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        <CardDescription>Perfect for verified startups.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentPlan === "growth" ? (
                            <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-950">Current Plan</Button>
                        ) : (
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleSwitchPlan("growth")}
                            >Switch to Growth</Button>
                        )}
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Email Accounts</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5,000 Emails / mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Warmup & Analytics</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Hypergrowth Plan */}
                <Card className={cn("bg-[#111] border-[#222] relative overflow-hidden", currentPlan === "hypergrowth" && "border-blue-500/50")}>
                    <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 font-bold">POPULAR</div>
                    <CardHeader>
                        <CardTitle className="text-white">Hypergrowth</CardTitle>
                        <div className="text-3xl font-bold text-white mt-2">$97<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        <CardDescription>Scale your outreach massively.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentPlan === "hypergrowth" ? (
                            <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-950">Current Plan</Button>
                        ) : (
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleSwitchPlan("hypergrowth")}
                            >Switch to Hypergrowth</Button>
                        )}
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Email Accounts</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 25,000 Emails / mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Advanced AI Writer</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Light Speed */}
                <Card className={cn("bg-[#111] border-[#222] relative overflow-hidden", currentPlan === "lightspeed" && "border-blue-500/50")}>
                    <CardHeader>
                        <CardTitle className="text-white">Light Speed</CardTitle>
                        <div className="text-3xl font-bold text-white mt-2">$297<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        <CardDescription>For agencies & enterprise teams.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentPlan === "lightspeed" ? (
                            <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-950">Current Plan</Button>
                        ) : (
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleSwitchPlan("lightspeed")}
                            >Switch to Light Speed</Button>
                        )}
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 100,000 Emails / mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Dedicated Success Manager</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Whitelabeling</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Enterprise Plan */}
                <Card className="bg-[#111] border-[#222] relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-white">Enterprise</CardTitle>
                        <div className="text-3xl font-bold text-white mt-2">Custom</div>
                        <CardDescription>Tailored for high-volume needs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            className="w-full bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#333]"
                            onClick={() => toast({ title: "Contact Sales", description: "Sales request sent! We will contact you shortly." })}
                        >Contact Sales</Button>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Custom Email Limits</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Enterprise-grade Security</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 24/7 Priority Support</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices */}
            <Card className="bg-[#111] border-[#222]">
                <CardHeader>
                    <CardTitle className="text-white">Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-[#222] last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-[#222] rounded flex items-center justify-center text-gray-400">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Invoice #{2024000 + i} - Light Speed Plan</p>
                                        <p className="text-xs text-gray-500">Dec {19 - i}, 2024</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-sm text-white font-medium">$297.00</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-white"
                                        onClick={() => toast({ title: "Downloading", description: `Downloading invoice #${2024000 + i}...` })}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
