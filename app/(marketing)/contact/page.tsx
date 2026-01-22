"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CTASection } from "@/components/website/CTASection"
export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission
        console.log("Form submitted:", formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <>
            {/* Hero Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            Get in Touch
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        We&apos;d Love to{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            Hear From You
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Have questions about email tracking? Need help getting started? Want to learn more about our features?
                        Our dedicated support team is here to assist you every step of the way.
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium mb-2">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                                    >
                                        Send Message
                                        <Send className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                        <Mail className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Email Us</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Our team typically responds within 24 hours.
                                        </p>
                                        <a
                                            href="mailto:yashnilshukla1@gmail.com"
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            yashnilshukla1@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                        <Phone className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Call Us</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Available for support calls.
                                        </p>
                                        <a
                                            href="tel:+918169582368"
                                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            +91 8169582368
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-semibold mb-2">Need immediate help?</h3>
                                <p className="text-sm text-indigo-50 mb-4 opacity-90">
                                    Check out our comprehensive documentation and help center for quick answers.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="w-full bg-white text-indigo-600 hover:bg-slate-100 border-none transition-all"
                                >
                                    Visit Help Center
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Options */}
            <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Other Ways to Reach Us</h2>
                        <p className="text-lg text-muted-foreground">
                            Choose the support channel that works best for you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Chat with our support team in real-time during business hours.
                            </p>
                            <Button variant="outline" size="sm">
                                Start Chat
                            </Button>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Phone className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Schedule a Call</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Book a time to speak with our team about your needs.
                            </p>
                            <Button variant="outline" size="sm">
                                Book a Call
                            </Button>
                        </div>

                        <div className="p-6 rounded-xl bg-card border border-border text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Community Forum</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Join our community and get help from other users.
                            </p>
                            <Button variant="outline" size="sm">
                                Visit Forum
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <CTASection
                title="Ready to Transform Your Email Engagement?"
                description="Join over 50,000 users who love Instantly for their email tracking needs. Start tracking emails today and never miss an important engagement."
                buttonText="Start Tracking Free Today"
            />
        </>
    )
}
