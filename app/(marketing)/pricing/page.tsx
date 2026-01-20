"use client"

import Link from "next/link"
import { ArrowRight, Check, X, Zap, TrendingUp, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CTASection } from "@/components/website/CTASection"
export default function PricingPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            Simple, Transparent Pricing
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Choose the{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                            Perfect Plan
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Start free and scale as you grow. No hidden fees, no surprises.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Starter Plan */}
                        <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="h-5 w-5 text-blue-500" />
                                <h3 className="text-2xl font-bold">Starter</h3>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                Perfect for individuals and small teams getting started.
                            </p>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">$0</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Forever free</p>
                            </div>

                            <Link href="/signup" className="block mb-6">
                                <Button variant="outline" className="w-full" size="lg">
                                    Get Started Free
                                </Button>
                            </Link>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Up to 100 tracked emails/month</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Basic email tracking</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Real-time notifications</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">7-day data retention</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Email support</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">Advanced analytics</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">API access</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">Team collaboration</span>
                                </div>
                            </div>
                        </div>

                        {/* Professional Plan */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white relative overflow-hidden">
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                                MOST POPULAR
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5" />
                                <h3 className="text-2xl font-bold">Professional</h3>
                            </div>
                            <p className="text-orange-50 mb-6">
                                For growing teams and businesses that need more power.
                            </p>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">$29</span>
                                    <span className="text-orange-50">/month</span>
                                </div>
                                <p className="text-sm text-orange-50 mt-1">Billed monthly</p>
                            </div>

                            <Link href="/signup" className="block mb-6">
                                <Button className="w-full bg-white text-orange-600 hover:bg-orange-50" size="lg">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Unlimited tracked emails</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Advanced email tracking</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Real-time notifications</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Unlimited data retention</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Priority support</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Advanced analytics & reports</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">API access</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Up to 5 team members</span>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Crown className="h-5 w-5 text-purple-500" />
                                <h3 className="text-2xl font-bold">Enterprise</h3>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                For large organizations with advanced needs.
                            </p>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">Custom</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Contact us for pricing</p>
                            </div>

                            <Link href="/contact" className="block mb-6">
                                <Button variant="outline" className="w-full" size="lg">
                                    Contact Sales
                                </Button>
                            </Link>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Everything in Professional</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Unlimited team members</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Dedicated account manager</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Custom integrations</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">24/7 phone support</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">SLA guarantee</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">Custom data retention</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">On-premise deployment option</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to know about our pricing and plans.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-lg font-semibold mb-2">Can I change plans later?</h3>
                            <p className="text-muted-foreground">
                                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                                and we&apos;ll prorate any charges or credits.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
                            <p className="text-muted-foreground">
                                Yes, we offer a 14-day free trial for all paid plans. No credit card required to start.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                            <p className="text-muted-foreground">
                                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
                                Enterprise customers can also pay via invoice.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
                            <p className="text-muted-foreground">
                                Absolutely. You can cancel your subscription at any time. Your account will remain active
                                until the end of your billing period.
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-lg font-semibold mb-2">Do you offer discounts for annual billing?</h3>
                            <p className="text-muted-foreground">
                                Yes! Save 20% when you choose annual billing. Contact our sales team for custom pricing
                                on multi-year contracts.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <CTASection
                title="Ready to Get Started?"
                description="Join thousands of users tracking their emails with Trackly."
                buttonText="Start Free Trial"
            />
        </>
    )
}
