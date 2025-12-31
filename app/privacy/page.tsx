"use client"

import Link from "next/link"
import { Zap, ChevronLeft } from "lucide-react"

export default function PrivacyPage() {
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
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
                    </div>
                    <p className="text-sm text-gray-500">Last Updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Instantly.ai ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
                            the security of your personal data. This Privacy Policy explains how we collect, use, and safeguard
                            your information when you use our platform for cold email outreach and marketing automation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-white font-medium mb-2">Account Information</h3>
                                <p>When you register, we collect your name, email address, and company details to set up your account.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-2">Google Data (OAuth)</h3>
                                <p>
                                    If you connect your Google account, we request access to:
                                </p>
                                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
                                    <li>Read and send emails via SMTP/IMAP or Gmail API.</li>
                                    <li>Manage your Google Drive files (specifically for Google Sheets integration).</li>
                                    <li>Access basic profile information (name, email, profile picture).</li>
                                </ul>
                                <p className="mt-4 italic text-blue-400/80">
                                    Instantly.ai's use and transfer of information received from Google APIs to any other app will adhere to
                                    <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" className="underline ml-1">
                                        Google API Service User Data Policy
                                    </a>, including the Limited Use requirements.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                        <p>We use the collected data to:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Provide and maintain our outreach platform.</li>
                            <li>Enable automated email sending and reply tracking.</li>
                            <li>Personalize your experience and provide customer support.</li>
                            <li>Improve our AI models for lead enrichment and personalization.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
                        <p>
                            We implement industry-standard security measures, including 256-bit encryption for data at rest and in transit.
                            OAuth tokens are stored securely and are never shared with third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
                        <p>
                            You have the right to access, correct, or delete your personal data at any time. You can disconnect your
                            Google account via the settings panel, which will immediately revoke our access to your tokens.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br />
                            <span className="text-blue-400">support@instantly.ai</span>
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; 2025 Instantly.ai. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
