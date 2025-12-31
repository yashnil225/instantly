"use client"

import Link from "next/link"
import { Zap, ChevronLeft } from "lucide-react"

export default function TermsPage() {
    const lastUpdated = "December 31, 2025"

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-blue-500/30">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8 group">
                        <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="h-8 w-8 text-blue-500 fill-blue-500" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Terms of Service</h1>
                    </div>
                    <p className="text-sm text-gray-500">Last Updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Instantly.ai, you agree to be bound by these Terms of Service. If you do
                            not agree to these terms, please do not use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Use of Services</h2>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>You must be at least 18 years old to use the platform.</li>
                            <li>You are responsible for maintaining the confidentiality of your account.</li>
                            <li>You agree not to use the platform for any illegal activities, including spamming or violating anti-spam laws (e.g., CAN-SPAM Act).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Subscription and Payments</h2>
                        <p>
                            Instantly.ai offers various subscription plans. By choosing a plan, you agree to pay the fees
                            associated with that plan. All fees are non-refundable unless otherwise stated.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend your account at any time for violation of these
                            terms or for any other reason we deem necessary to protect our users and platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Limitation of Liability</h2>
                        <p>
                            Instantly.ai shall not be liable for any direct, indirect, incidental, or consequential damages
                            resulting from the use or inability to use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Changes to Terms</h2>
                        <p>
                            We may update these Terms of Service from time to time. We will notify you of any significant
                            changes by posting the new terms on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Governing Law</h2>
                        <p>
                            These terms are governed by and construed in accordance with the laws of the jurisdiction in
                            which the company is registered.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; 2025 Instantly.ai. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
