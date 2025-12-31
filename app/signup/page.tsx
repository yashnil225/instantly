"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

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
        <div className="auth-page signup-page">
            {/* Home Icon */}
            <Link href="/" className="home-icon" title="Home">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </Link>

            <div className="signup-container">
                {/* Left Side - Form */}
                <div className="signup-form-section">
                    {/* Logo */}
                    <div className="auth-logo">
                        <div className="logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="logo-text">Instantly</span>
                    </div>

                    <h1 className="auth-title signup-title">Create a new account</h1>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="auth-input"
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                />
                                <span className="checkbox-text">
                                    I agree to the Instantly <a href="#">Terms of Use</a> and <a href="#">Privacy policy</a>
                                </span>
                            </label>
                        </div>

                        {error && (
                            <div className="auth-error">{error}</div>
                        )}

                        <button type="submit" className="btn-primary btn-full" disabled={loading}>
                            {loading ? "Creating account..." : "Join Now"}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <div className="social-buttons">
                        <button type="button" className="btn-social" onClick={handleGoogleSignIn}>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign Up with Google
                        </button>
                    </div>

                    <div className="auth-footer">
                        Already have an account? <Link href="/login">Log In</Link>
                    </div>
                </div>

                {/* Right Side - Illustration */}
                <div className="signup-illustration">
                    <div className="illustration-content">
                        <div className="illustration-image">
                            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="180" y="20" width="180" height="140" rx="8" fill="#1E3A5F" />
                                <rect x="190" y="30" width="160" height="10" rx="2" fill="#2D5A87" />
                                <rect x="190" y="50" width="120" height="6" rx="2" fill="#2D5A87" />
                                <rect x="190" y="65" width="140" height="6" rx="2" fill="#2D5A87" />
                                <rect x="190" y="80" width="100" height="6" rx="2" fill="#2D5A87" />
                                <circle cx="330" cy="110" r="25" fill="#3B82F6" />
                                <rect x="190" y="100" width="80" height="40" rx="4" fill="#2D5A87" />
                                <ellipse cx="120" cy="280" rx="80" ry="15" fill="#1a1a1a" opacity="0.3" />
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
                        <h2 className="illustration-title">30,000+ clients</h2>
                        <p className="illustration-subtitle">are getting more replies!</p>
                        <p className="illustration-description">
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
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <SignupForm />
        </Suspense>
    )
}
