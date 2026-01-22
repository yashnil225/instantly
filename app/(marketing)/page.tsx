"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Mail, BarChart3, Clock, Shield, CheckCircle2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeatureSection } from "@/components/website/FeatureSection"
import { StatsCard } from "@/components/website/StatsCard"
import { CTASection } from "@/components/website/CTASection"
import { TestimonialSlider } from "@/components/website/TestimonialSlider"
export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Track Every Click and Open with Ease
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Effortlessly monitor your email performance with our intuitive tracking system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-[#ff6b35] hover:bg-[#ff8c5a] text-white px-8 text-base rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#ff6b35]/20"
                  >
                    Get started now
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="ghost" className="text-base flex items-center gap-1 transition-all hover:gap-2">
                    View pricing <span className="text-lg">→</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Dashboard Mockup */}
            <div className="relative group">
              <div className="relative z-10 transform lg:rotate-2 lg:scale-105 transition-all duration-700 hover:rotate-0 hover:scale-110">
                <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-card/50 backdrop-blur-sm p-1">
                  <Image
                    src="/marketing/dashboard-hero.png"
                    alt="Email tracking dashboard showing analytics, charts, and real-time metrics"
                    width={700}
                    height={600}
                    className="rounded-xl dark:opacity-90 dark:brightness-90 transition-all duration-300"
                    priority
                  />
                </div>
              </div>
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard label="Emails Tracked" value="10M+" />
            <StatsCard label="Open Rate" value="98.2%" />
            <StatsCard label="Active Users" value="50K+" />
            <StatsCard label="Customer Rating" value="4.9/5" />
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
                Track Unlimited Emails to One or Multiple Recipients
              </h2>

              <p className="text-lg text-muted-foreground">
                Send tracking pixels to unlimited recipients and monitor every interaction in real-time.
                Whether you&apos;re managing a sales pipeline, running email campaigns, or following up with clients,
                our platform gives you complete visibility into email engagement.
              </p>

              <p className="text-base text-muted-foreground">
                Get instant notifications when emails are opened, links are clicked, and attachments are downloaded.
                Our intelligent tracking system works seamlessly with all major email providers including Gmail,
                Outlook, Apple Mail, and more, ensuring you never miss an important engagement.
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Real-time open tracking</span>
                    <p className="text-sm text-muted-foreground">Know exactly when your emails are opened with precise timestamps and location data</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Link click analytics</span>
                    <p className="text-sm text-muted-foreground">Track every link click and understand which content drives the most engagement</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Attachment monitoring</span>
                    <p className="text-sm text-muted-foreground">Receive instant notifications when recipients download or view your email attachments</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Multi-open detection</span>
                    <p className="text-sm text-muted-foreground">See when recipients open your emails multiple times, indicating strong interest</p>
                  </div>
                </li>
              </ul>

              <Link href="/features">
                <Button variant="outline" size="lg">
                  Learn More About Features
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
                      <div className="text-4xl font-bold text-orange-600">10M+</div>
                      <div className="text-sm text-muted-foreground">Emails Tracked</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Emails Sent</span>
                    <span className="text-sm text-muted-foreground">10,245,893</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Emails Opened</span>
                    <span className="text-sm font-muted-foreground">9,847,256</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Links Clicked</span>
                    <span className="text-sm text-muted-foreground">4,234,567</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-semibold text-green-600">Open Rate</span>
                    <span className="text-sm font-bold text-green-600">98.2%</span>
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
              Guaranteed Delivery to Inbox for Every Single Email
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Ensure your emails reach the inbox, not spam. Our advanced delivery infrastructure and best-practice
              email authentication protocols guarantee industry-leading deliverability rates. We use sophisticated
              sender reputation management, intelligent sending patterns, and compliance with all major ISP requirements
              to ensure your messages always land where they belong.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Spam Protection</h3>
              <p className="text-muted-foreground">
                Our sophisticated spam filtering algorithms and sender reputation monitoring ensure your emails land in
                the inbox, not the spam folder. We continuously monitor blacklists, maintain clean IP addresses, and
                follow industry best practices to protect your sender reputation.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Domain Authentication</h3>
              <p className="text-muted-foreground">
                Proper SPF, DKIM, and DMARC setup to maximize email deliverability and build trust with major email
                providers. Our automated verification system ensures your domain is properly authenticated across all
                major ISPs including Gmail, Outlook, Yahoo, and more.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Industry-Leading 98.2% Delivery Rate</h3>
              <p className="text-muted-foreground">
                Our platform maintains one of the highest delivery rates in the industry through continuous monitoring,
                real-time deliverability analytics, and proactive issue resolution. We track bounces, complaints, and
                engagement metrics to ensure optimal inbox placement for every campaign.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Join thousands of happy users who have transformed
              their email engagement with Instantly.
            </p>
          </div>
          <TestimonialSlider />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Never Miss an Important Email Engagement"
        description="Stay on top of every email interaction with instant notifications and real-time tracking. Know exactly when your prospects are engaging so you can follow up at the perfect moment and close more deals."
        buttonText="Start Tracking Free Today"
      />
    </>
  )
}
