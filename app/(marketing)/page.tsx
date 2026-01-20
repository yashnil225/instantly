"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Mail, BarChart3, Clock, Shield, Zap, CheckCircle2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeatureSection } from "@/components/website/FeatureSection"
import { StatsCard } from "@/components/website/StatsCard"
import { CTASection } from "@/components/website/CTASection"
export default function Home() {
  return (
    <>
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Email Tracking Made Simple
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Track Every Click and{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Open with Ease
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Effortlessly monitor your email performance with our intuitive tracking system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8"
                  >
                    Get started free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View pricing
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Mockup */}
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/marketing/dashboard-hero.png"
                  alt="Email tracking dashboard"
                  width={600}
                  height={500}
                  className="rounded-2xl shadow-2xl border border-border"
                  priority
                />
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-green-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard label="Emails Tracked" value="2.8K+" />
            <StatsCard label="Delivery Rate" value="98%" />
            <StatsCard label="Active Users" value="5K+" />
            <StatsCard label="Support" value="24/7" />
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Unlimited Tracking */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Unlimited Tracking</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold">
                Track Unlimited Emails One or Multiple Recipients
              </h2>

              <p className="text-lg text-muted-foreground">
                Send tracking pixels to unlimited recipients and monitor every interaction.
                Get real-time notifications when emails are opened, links are clicked, and attachments are downloaded.
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Real-time open tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Click tracking for all links</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Attachment download notifications</span>
                </li>
              </ul>

              <Link href="/features">
                <Button variant="outline" size="lg">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray="552"
                        strokeDashoffset="138"
                        className="text-green-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold text-indigo-600">2.8K</div>
                      <div className="text-sm text-muted-foreground">Tracking Stats</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Email Sent</span>
                    <span className="text-sm text-muted-foreground">3,245</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Email Open</span>
                    <span className="text-sm text-muted-foreground">2,847</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Link Clicked</span>
                    <span className="text-sm text-muted-foreground">1,234</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Real-Time Tracking */}
      <FeatureSection
        title="Detailed Real-Time Tracking for Every Email Interaction"
        description="Get instant insights into how recipients engage with your emails. Track opens, clicks, and responses in real-time with detailed analytics."
        imageSrc="/marketing/analytics-chart.png"
        imageAlt="Real-time analytics"
        badgeText="Real-Time Data"
        badgeIcon={Clock}
        reverse
        bgMuted
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <BarChart3 className="h-8 w-8 text-indigo-500 mb-2" />
            <div className="text-2xl font-bold mb-1">42%</div>
            <div className="text-sm text-muted-foreground">Open Rate</div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold mb-1">15%</div>
            <div className="text-sm text-muted-foreground">Click Rate</div>
          </div>
        </div>
      </FeatureSection>

      {/* Feature Section 3 - Detailed Engagement */}
      <FeatureSection
        title="Detailed Engagement Email Analytics"
        description="Dive deep into your email performance with comprehensive analytics. Track individual recipient behavior, engagement patterns, and response rates."
        imageSrc="/marketing/engagement-table.png"
        imageAlt="Engagement analytics table"
        badgeText="Detailed Analytics"
        badgeIcon={BarChart3}
        items={[
          "Individual recipient tracking",
          "Engagement heatmaps",
          "Export detailed reports"
        ]}
      />

      {/* Feature Section 4 - Guaranteed Delivery */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Guaranteed Delivery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Guaranteed Delivery Inbox Every Single Email
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Ensure your emails reach the inbox, not spam. Our advanced delivery infrastructure
              guarantees maximum deliverability rates.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Spam Protection</h3>
              <p className="text-muted-foreground">
                Advanced spam filters ensure your emails land in the inbox, not the spam folder.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Domain Authentication</h3>
              <p className="text-muted-foreground">
                Proper SPF, DKIM, and DMARC setup to maximize email deliverability.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">98% Delivery Rate</h3>
              <p className="text-muted-foreground">
                Industry-leading delivery rates ensure your messages reach their destination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Follow Up Top Of Mind"
        description="Never miss an opportunity to engage. Get instant notifications and stay on top of every email interaction."
        buttonText="Get Started Free"
      />
    </>
  )
}
