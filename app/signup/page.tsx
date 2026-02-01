"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"

function SignupForm() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // Check for redirect from login page (no account exists)
    useEffect(() => {
        const errorParam = searchParams.get('error')
        const emailParam = searchParams.get('email')
        const nameParam = searchParams.get('name')

        if (errorParam === 'no_account') {
            toast({
                title: "Account Not Found",
                description: "No account exists with this email. Please sign up to create one.",
            })

            // Pre-fill email if provided
            if (emailParam) {
                setEmail(decodeURIComponent(emailParam))
            }

            // Pre-fill name if provided (from Google)
            if (nameParam) {
                const names = decodeURIComponent(nameParam).split(' ')
                setFirstName(names[0] || '')
                setLastName(names.slice(1).join(' ') || '')
            }
        }
    }, [searchParams, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!termsAccepted) {
            toast({
                title: "Terms and Conditions",
                description: "Please accept the terms and conditions to continue.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const name = `${firstName} ${lastName}`.trim()
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await res.json()

            if (res.status === 409 || (res.status === 400 && data.error === "User already exists")) {
                const signInResult = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                })

                if (signInResult?.error) {
                    setError("User already exists. Please login with your password.")
                    return
                }

                localStorage.setItem('instantly_auth', 'true')
                router.push("/campaigns?welcome=true")
                router.refresh()
                return
            }

            if (!res.ok) {
                setError(data.error || "Signup failed")
                return
            }

            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (signInResult?.error) {
                toast({
                    title: "Account Created!",
                    description: "Please log in with your credentials.",
                })
                router.push("/login")
            } else {
                localStorage.setItem('instantly_auth', 'true')
                toast({
                    title: "Welcome to Instantly!",
                    description: "Your account has been created. Let's get started!",
                })
                router.push("/campaigns?welcome=true")
                router.refresh()
            }

        } catch (error) {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/campaigns?welcome=true" })
    }

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Home Icon */}
            <Link href="/" className="absolute top-6 right-6 lg:left-6 lg:right-auto text-muted-foreground hover:text-foreground transition-colors z-10" title="Home">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </Link>

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background order-1">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-semibold text-blue-500">Instantly</span>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground">Create a new account</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                                I agree to the Instantly <a href="#" className="text-blue-500 hover:underline">Terms of Use</a> and <a href="#" className="text-blue-500 hover:underline">Privacy policy</a>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Join Now"}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-transparent border border-border rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign Up with Google
                    </button>

                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Log In</Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="w-full lg:w-1/2 bg-[#0f172a] p-8 flex items-center justify-center order-2">
                <div className="max-w-md text-center space-y-8">
                    <div className="relative w-64 h-64 mx-auto">
                        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <rect x="180" y="20" width="180" height="140" rx="8" fill="#1E3A5F" />
                            <rect x="190" y="30" width="160" height="10" rx="2" fill="#2D5A87" />
                            <rect x="190" y="50" width="120" height="6" rx="2" fill="#2D5A87" />
                            <rect x="190" y="65" width="140" height="6" rx="2" fill="#2D5A87" />
                            <rect x="190" y="80" width="100" height="6" rx="2" fill="#2D5A87" />
                            <circle cx="330" cy="110" r="25" fill="#3B82F6" />
                            <rect x="190" y="100" width="80" height="40" rx="4" fill="#2D5A87" />
                            <ellipse cx="120" cy="280" rx="80" ry="15" fill="#000" opacity="0.3" />
                            <path d="M80 180 L160 180 L150 270 L90 270 Z" fill="#3B82F6" />
                            <circle cx="120" cy="140" r="40" fill="#F5D0C5" />
                            <path d="M85 125 Q120 100 155 125" stroke="#4A3728" strokeWidth="8" fill="none" />
                            <ellipse cx="105" cy="145" rx="5" ry="6" fill="#333" />
                            <ellipse cx="135" cy="145" rx="5" ry="6" fill="#333" />
                            <path d="M115 160 Q120 165 125 160" stroke="#333" strokeWidth="2" fill="none" />
                            <path d="M160 200 L200 180 L220 200 L180 220 Z" fill="#3B82F6" />
                            <rect x="185" y="175" width="40" height="30" rx="3" fill="#2D5A87" />
                            <rect x="190" y="180" width="30" height="20" rx="2" fill="#1E3A5F" />
                            <circle cx="280" cy="200" r="15" fill="#3B82F6" opacity="0.6" />
                            <circle cx="320" cy="180" r="10" fill="#60A5FA" opacity="0.4" />
                            <circle cx="350" cy="220" r="8" fill="#93C5FD" opacity="0.3" />
                        </svg>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-white">30,000+ clients</h2>
                        <p className="text-blue-400 text-xl font-medium">are getting more replies!</p>
                        <p className="text-gray-400 leading-relaxed">
                            Unlock the power of effective outreach with our cutting-edge platform, and experience a surge in responses and engagement rates like never before.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-foreground">Loading...</div></div>}>
            <SignupForm />
        </Suspense>
    )
}
