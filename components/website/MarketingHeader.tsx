"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function MarketingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            Instantly
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/features"
                            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/contact"
                            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                        >
                            Contact
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                Log In
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                            >
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background">
                    <div className="px-4 py-4 space-y-3">
                        <Link
                            href="/"
                            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/features"
                            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="/pricing"
                            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/contact"
                            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        <div className="pt-4 space-y-2">
                            <Link href="/login" className="block">
                                <Button variant="outline" className="w-full">
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/signup" className="block">
                                <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
