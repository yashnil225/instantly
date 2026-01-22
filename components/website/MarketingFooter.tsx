import Link from "next/link"
import { Logo } from "@/components/ui/logo"


export function MarketingFooter() {
    return (
        <footer className="bg-muted/30 border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Logo size="md" />
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                Instantly
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            Unlimited cold email outreach. Built for modern sales and marketing teams.
                        </p>

                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Integrations
                                </Link>
                            </li>
                            <li>
                                <Link href="/changelog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Changelog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Services</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/email-tracking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Email Tracking
                                </Link>
                            </li>
                            <li>
                                <Link href="/analytics-page" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Analytics
                                </Link>
                            </li>
                            <li>
                                <Link href="/automation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Automation
                                </Link>
                            </li>
                            <li>
                                <Link href="/api-access" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    API Access
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/documentation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/help-center" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Status
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Privacy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Terms
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                        © {new Date().getFullYear()} Instantly. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
