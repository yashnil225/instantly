"use client"

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
                        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                        <p className="text-muted-foreground italic">Last Updated: January 16, 2026</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                        <Lock className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-primary">Your Data is Encrypted</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-10">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to Instantly.ai. We respect your privacy and are committed to protecting your personal data. This policy outlines how we handle your information.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white">Account Information</h3>
                            <p className="text-muted-foreground">We collect your name, email, and company details when you register.</p>

                            <h3 className="text-xl font-semibold text-white">Google Data (OAuth)</h3>
                            <p className="text-muted-foreground">If you connect your Google account, we access only the necessary scopes to send emails and manage your warmup process. We do not store your emails on our servers unless specifically required for the service functionality.</p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. How We Use Data</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>To provide and manage your account.</li>
                            <li>To facilitate automated cold email outreach.</li>
                            <li>To improve our AI-driven personalization engines.</li>
                            <li>To provide customer support and technical assistance.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use industry-standard encryption (AES-256) to ensure your data remains secure at all times. Tokens are stored in a highly secure, isolated environment.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">5. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to access, export, or delete your data at any time. Contact us for any data-related requests.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="pt-12 border-t border-border flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-bold text-primary">Instantly</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Questions? Reach out to privacy@instantly.ai</p>
                    <Link href="https://instantly-ai.vercel.app/login">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
