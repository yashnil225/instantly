"use client"

import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group mb-4">
                            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                        <p className="text-muted-foreground italic">Last Updated: January 16, 2026</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-primary">Secure & Transparent</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using Instantly.ai, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. Use of Service</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>You must be at least 18 years old to use this service.</li>
                            <li>You are responsible for maintaining the security of your account.</li>
                            <li>You agree not to use the service for any illegal or unauthorized purpose, including spamming in violation of CAN-SPAM or GDPR regulations.</li>
                            <li>Instantly.ai reserves the right to terminate accounts that violate our anti-spam policy.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. Subscription and Fees</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Fees are charged based on the selected subscription plan. All payments are non-refundable unless stated otherwise.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">4. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Instantly.ai shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of our services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">5. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of the new terms.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="pt-12 border-t border-border flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-bold text-primary">Instantly</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Questions? Contact us at support@instantly.ai</p>
                    <Link href="https://instantly-ai.vercel.app/login">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
