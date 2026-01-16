"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Zap, Shield, BarChart3, Mail, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ThemeDropdown } from "@/components/ui/theme-dropdown"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/60 border-b border-border">
        <div className="flex items-center gap-2">
          <Logo size="md" />
          <span className="text-xl font-bold text-primary">Instantly</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="/terms" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeDropdown />
          <Link href="https://instantly-ai.vercel.app/login">
            <Button variant="ghost" className="text-sm font-medium">Log In</Button>
          </Link>
          <Link href="https://instantly-ai.vercel.app/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white px-6">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3 h-3 fill-primary" />
                <span>The Future of Outreach</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Send cold emails that <span className="text-primary italic">actually</span> get replies.
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Scale your outreach with unlimited accounts, AI-powered warmup, and seamless CRM integration. Built for agencies and scaleups.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="https://instantly-ai.vercel.app/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white group shadow-lg shadow-primary/20">
                    Start Sending
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-border bg-background/50 backdrop-blur-sm">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                        alt="avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span>Joined by 30,000+ happy users</span>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/hero.png"
                  alt="Instantly Platform Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto transform transition duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 py-4 px-6 bg-gradient-to-t from-background/90 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium">Live Dashboard Stats</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">v2.4.0 Updated</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to scale revenue</h2>
              <p className="text-lg text-muted-foreground">Stop worrying about deliverability and start focusing on closing deals with our all-in-one suite.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Mail className="w-6 h-6 text-primary" />,
                  title: "Unlimited Accounts",
                  desc: "Connect as many sender accounts as you need without extra costs. Scale your volume effortlessly."
                },
                {
                  icon: <Shield className="w-6 h-6 text-green-500" />,
                  title: "AI Warmup",
                  desc: "Keep your emails out of spam folders with our automated AI-driven warmup engine."
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-purple-500" />,
                  title: "Advanced Analytics",
                  desc: "Track every open, click, and reply with precision. Optimize your campaigns with data-driven insights."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="px-6 py-24 border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted by world class teams</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
              {/* Simple SVG logos or text placeholders for demo purposes */}
              <span className="text-2xl font-bold tracking-tighter">STRIPE</span>
              <span className="text-2xl font-bold tracking-tighter">AIRBNB</span>
              <span className="text-2xl font-bold tracking-tighter">HUBSPOT</span>
              <span className="text-2xl font-bold tracking-tighter">SHOPIFY</span>
              <span className="text-2xl font-bold tracking-tighter">SLACK</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -skew-y-3 origin-top-left" />
          <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ready to boost your outreach?</h2>
            <p className="text-xl text-muted-foreground">Join 30,000+ high-growth companies using Instantly to hit their sales targets.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="https://instantly-ai.vercel.app/signup">
                <Button size="lg" className="h-16 px-12 text-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30">
                  Get Started Now
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Unlimited senders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>AI-Powered Warmup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-xl font-bold text-primary">Instantly</span>
            </div>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Empowering sales teams with the world&apos;s most powerful cold email platform. Deliverability, scale, and results.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="https://instantly-ai.vercel.app/login" className="hover:text-primary transition-colors">Login</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">© 2026 Instantly.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
