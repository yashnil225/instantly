"use client"

import Link from "next/link"
import { ArrowRight, BarChart3, Shield, Zap, Bell, Download, Eye, MousePointerClick, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeatureCard } from "@/components/website/FeatureCard"
import { FeatureSection } from "@/components/website/FeatureSection"
import { CTASection } from "@/components/website/CTASection"
import { FeatureComparisonTable } from "@/components/website/FeatureComparisonTable"
export default function FeaturesPage() {
    return (
        <>
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            Powerful Features
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Everything You Need to{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            Track Emails
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Comprehensive email tracking and analytics tools designed to help you understand,
                        optimize, and improve your email engagement. From real-time notifications to detailed
                        analytics, we provide everything you need to maximize your email ROI.
                    </p>

                    <Link href="/signup">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Core Features Grid */}
            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Tracking Features</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Track every aspect of your email campaigns with our comprehensive suite of powerful,
                            enterprise-grade tools. From opens and clicks to downloads and engagement patterns,
                            gain complete visibility into how recipients interact with your emails.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            className="hover:scale-105 transition-all duration-300"
                            title="Email Open Tracking"
                            description="Know exactly when your emails are opened with real-time notifications and detailed timestamps."
                            icon={Eye}
                            items={[
                                "Real-time open notifications",
                                "Multiple open tracking",
                                "Device & location data"
                            ]}
                        />
                        <FeatureCard
                            title="Link Click Tracking"
                            description="Track every link click in your emails and understand which content drives engagement."
                            icon={MousePointerClick}
                            iconColor="text-blue-600"
                            iconBgColor="bg-blue-500/10"
                            items={[
                                "Individual link tracking",
                                "Click heatmaps",
                                "Conversion tracking"
                            ]}
                        />
                        <FeatureCard
                            title="Attachment Tracking"
                            description="Get notified when recipients download or view your email attachments."
                            icon={Download}
                            iconColor="text-green-600"
                            iconBgColor="bg-green-500/10"
                            items={[
                                "Download notifications",
                                "View time tracking",
                                "File engagement analytics"
                            ]}
                        />
                        <FeatureCard
                            title="Advanced Analytics"
                            description="Comprehensive analytics dashboard with detailed insights into email performance."
                            icon={BarChart3}
                            iconColor="text-purple-600"
                            iconBgColor="bg-purple-500/10"
                            items={[
                                "Real-time dashboards",
                                "Custom reports",
                                "Export capabilities"
                            ]}
                        />
                        <FeatureCard
                            title="Smart Notifications"
                            description="Get instant alerts when important email events occur, customized to your preferences."
                            icon={Bell}
                            iconColor="text-yellow-600"
                            iconBgColor="bg-yellow-500/10"
                            items={[
                                "Email & browser notifications",
                                "Custom alert rules",
                                "Slack & Teams integration"
                            ]}
                        />
                        <FeatureCard
                            title="Privacy & Security"
                            description="Enterprise-grade security with GDPR compliance and data encryption."
                            icon={Shield}
                            iconColor="text-red-600"
                            iconBgColor="bg-red-500/10"
                            items={[
                                "GDPR compliant",
                                "End-to-end encryption",
                                "SOC 2 certified"
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Detailed Features */}
            <FeatureSection
                title="Comprehensive Attachment Tracking"
                description="Track every document you send. Know which pages were read, how much time was spent on each, and who downloaded your files."
                imageSrc="/marketing/attachment-tracking.png"
                imageAlt="Attachment tracking dashboard"
                badgeText="Analytics"
                badgeIcon={Download}
                bgMuted
                items={[
                    "Page-by-page analytics",
                    "Download timestamps",
                    "Access control & permissions"
                ]}
            />

            <FeatureSection
                title="Smart, Contextual Notifications"
                description="Get notified the moment something happens. Our smart filters ensure you only get the alerts that matter most to your workflow."
                imageSrc="/marketing/smart-notifications.png"
                imageAlt="Smart notifications interface"
                badgeText="Alerts"
                badgeIcon={Bell}
                reverse
                items={[
                    "Instant desktop push alerts",
                    "Mobile app notifications",
                    "Email digest summaries"
                ]}
            />

            {/* Integration Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Seamless Integrations</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Connect with your favorite tools and platforms for a unified workflow.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <Globe className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                            <h3 className="text-lg font-semibold mb-2">Email Clients</h3>
                            <p className="text-sm text-muted-foreground">
                                Gmail, Outlook, Apple Mail, and more
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <Lock className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <h3 className="text-lg font-semibold mb-2">CRM Systems</h3>
                            <p className="text-sm text-muted-foreground">
                                Salesforce, HubSpot, Pipedrive
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <Zap className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                            <h3 className="text-lg font-semibold mb-2">Automation</h3>
                            <p className="text-sm text-muted-foreground">
                                Zapier, Make, API access
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare Our Plans</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Choose the roadmap that fits your growth. Detailed feature breakdown for every stage of your business.
                        </p>
                    </div>
                    <FeatureComparisonTable />
                </div>
            </section>

            {/* CTA Section */}
            <CTASection
                title="Ready to Transform Your Email Strategy?"
                description="Join over 50,000 users who trust Instantly for their email tracking needs. Start making data-driven decisions with real-time insights and comprehensive analytics."
                buttonText="Start Tracking Emails Free"
            />
        </>
    )
}
