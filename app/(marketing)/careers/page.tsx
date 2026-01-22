"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, MapPin, Clock } from "lucide-react"
import Link from "next/link"

const jobs = [
    {
        title: "Senior Full Stack Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time"
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Hybrid (SF)",
        type: "Full-time"
    },
    {
        title: "Sales Account Executive",
        department: "Sales",
        location: "Remote",
        type: "Full-time"
    },
    {
        title: "Customer Support Specialist",
        department: "Support",
        location: "Remote",
        type: "Full-time"
    }
]

export default function CareersPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-indigo-600 text-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Build the future of email engagement</h1>
                        <p className="text-xl text-indigo-100 mb-8">
                            We&apos;re a remote-first team of creators, engineers, and dreamers building the most powerful email tracking platform on the planet. Join us.
                        </p>
                        <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none rounded-full px-8">
                            View Open Positions
                        </Button>
                    </div>
                </div>
                {/* Abstract shapes for background */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/20 skew-x-12 transform -translate-y-1/4" />
                <div className="absolute bottom-0 right-1/4 w-1/4 h-1/2 bg-white/5 rounded-full blur-3xl" />
            </section>

            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Our Culture</h2>
                            <p className="text-lg text-muted-foreground mb-4">
                                At Instantly, we value autonomy, transparency, and relentless focus on the customer. We believe that great work happens when talented people are given the freedom to solve complex problems in their own way.
                            </p>
                            <p className="text-lg text-muted-foreground">
                                Whether you&apos;re working from a coffee shop in Bali or your home office in Berlin, you&apos;re a vital part of our mission to humanize digital communication.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Remote First", desc: "Work from anywhere in the world" },
                                { title: "Unlimited PTO", desc: "Take time off when you need it" },
                                { title: "Learning Budget", desc: "$2k/year for your development" },
                                { title: "Home Office Stipend", desc: "$1k to build your perfect setup" }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-muted/50 rounded-2xl border border-border">
                                    <h3 className="font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold">Open Positions</h2>
                        <div className="grid gap-4">
                            {jobs.map((job, index) => (
                                <div key={index} className="p-6 bg-card border border-border rounded-2xl hover:border-indigo-500 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="h-4 w-4" />
                                                {job.department}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {job.location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {job.type}
                                            </div>
                                        </div>
                                    </div>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
                                        Apply Now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
