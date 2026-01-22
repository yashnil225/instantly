"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const features = [
    {
        name: "Monthly Tracked Emails",
        starter: "100",
        pro: "Unlimited",
        enterprise: "Custom"
    },
    {
        name: "Real-time Notifications",
        starter: true,
        pro: true,
        enterprise: true
    },
    {
        name: "Advanced Analytics",
        starter: false,
        pro: true,
        enterprise: true
    },
    {
        name: "Custom Reports",
        starter: false,
        pro: true,
        enterprise: true
    },
    {
        name: "API Access",
        starter: false,
        pro: true,
        enterprise: true
    },
    {
        name: "Team Members",
        starter: "1",
        pro: "Up to 5",
        enterprise: "Unlimited"
    },
    {
        name: "Data Retention",
        starter: "7 Days",
        pro: "Unlimited",
        enterprise: "Unlimited"
    },
    {
        name: "Priority Support",
        starter: false,
        pro: true,
        enterprise: true
    },
    {
        name: "Dedicated Account Manager",
        starter: false,
        pro: false,
        enterprise: true
    }
]

export function FeatureComparisonTable() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="py-4 px-6 bg-muted/50 font-bold border-b border-border">Features</th>
                        <th className="py-4 px-6 bg-muted/50 font-bold border-b border-border text-center">Starter</th>
                        <th className="py-4 px-6 bg-indigo-500/10 font-bold border-b border-indigo-500/20 text-center text-indigo-600">Professional</th>
                        <th className="py-4 px-6 bg-muted/50 font-bold border-b border-border text-center">Enterprise</th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((feature, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-6 text-sm font-medium">{feature.name}</td>
                            <td className="py-4 px-6 text-center">
                                {typeof feature.starter === "boolean" ? (
                                    feature.starter ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                ) : (
                                    <span className="text-sm">{feature.starter}</span>
                                )}
                            </td>
                            <td className="py-4 px-6 text-center bg-indigo-500/5">
                                {typeof feature.pro === "boolean" ? (
                                    feature.pro ? <Check className="h-5 w-5 text-indigo-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                ) : (
                                    <span className="text-sm font-semibold text-indigo-600">{feature.pro}</span>
                                )}
                            </td>
                            <td className="py-4 px-6 text-center">
                                {typeof feature.enterprise === "boolean" ? (
                                    feature.enterprise ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                ) : (
                                    <span className="text-sm">{feature.enterprise}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td className="py-8 px-6"></td>
                        <td className="py-8 px-6 text-center">
                            <Link href="/signup">
                                <Button variant="outline" size="sm">Get Started</Button>
                            </Link>
                        </td>
                        <td className="py-8 px-6 text-center bg-indigo-500/5">
                            <Link href="/signup">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">Start Free Trial</Button>
                            </Link>
                        </td>
                        <td className="py-8 px-6 text-center">
                            <Link href="/contact">
                                <Button variant="outline" size="sm">Contact Sales</Button>
                            </Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
