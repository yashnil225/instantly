"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Home, Apple, Star } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import toast, { Toaster } from 'react-hot-toast'

function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Check for redirect from login page
    useEffect(() => {
        const errorParam = searchParams.get('error')
        const emailParam = searchParams.get('email')
        const nameParam = searchParams.get('name')

        if (errorParam === 'no_account') {
            toast.error("Account Not Found. Please sign up to create one.")

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
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!termsAccepted) {
            toast.error("Please accept the Instantly terms of use and privacy policy.")
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
                    toast.error("User already exists. Please login with your password.")
                    return
                }

                localStorage.setItem('instantly_auth', 'true')
                toast.success("Signed up!")
                setTimeout(() => {
                    router.push("/campaigns?welcome=true")
                    router.refresh()
                }, 800)
                return
            }

            if (!res.ok) {
                toast.error(data.error || "Signup failed")
                return
            }

            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (signInResult?.error) {
                router.push("/login")
            } else {
                localStorage.setItem('instantly_auth', 'true')
                toast.success("Signed up!")
                setTimeout(() => {
                    router.push("/campaigns?welcome=true")
                    router.refresh()
                }, 800)
            }

        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/campaigns?welcome=true" })
    }

    return (
        <div className="min-h-screen flex font-['Averta',_sans-serif] bg-white overflow-hidden">
            <Toaster position="bottom-center" />

            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-50">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all border border-[#dee2e6] flex items-center justify-center shadow-sm"
                    title="Home"
                >
                    <Home className="h-5 w-5 text-[#8492a6]" />
                </a>
            </div>

            {/* Left Side: Signup Form (7 parts) */}
            <div className="flex-[7] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-[380px] mx-auto py-8">
                    {/* Logo */}
                    <div className="flex justify-center items-center gap-2 mb-10">
                        <Logo style={{ width: '32px', height: '32px' }} />
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-[24px] font-bold text-center text-gray-900 mb-2">Create a new account</h1>

                        {/* Social Signups */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleSignIn}
                                className="social-btn"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" className="mt-[-1px]">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-[15px] font-medium text-gray-700">Sign Up with Google</span>
                            </button>

                            <button className="social-btn">
                                <Apple className="h-[22px] w-[22px] mt-[-4px]" />
                                <span className="text-[15px] font-medium text-gray-700">Sign Up with Apple</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-[1px] bg-[#dee2e6]"></div>
                            <span className="text-[12px] text-[#8492a6] font-medium tracking-wider">OR</span>
                            <div className="flex-1 h-[1px] bg-[#dee2e6]"></div>
                        </div>

                        {/* Signup Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="auth-input"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="auth-input"
                            />

                            {/* Terms Checkbox */}
                            <div className="flex items-start space-x-3 py-2">
                                <div className="flex items-center h-5 mt-1">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#006bff] focus:ring-[#006bff] transition-all cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="terms" className="text-[13px] text-gray-500 leading-[1.4]">
                                    I agree to the Instantly <a href="https://instantly.ai/terms" target="_blank" rel="noreferrer" className="buttonText transition-colors font-medium">Terms of Use</a> and <a href="https://instantly.ai/privacy" target="_blank" rel="noreferrer" className="buttonText transition-colors font-medium">Privacy policy</a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-[16px] bg-[#006bff] hover:bg-[#0056d2] text-white font-bold rounded-[12px] text-[16px] transition-all disabled:opacity-50 mt-2 shadow-[0_4px_12px_rgba(0,107,255,0.15)]"
                            >
                                {loading ? "Creating account..." : "Join Now"}
                            </button>
                        </form>
                    </div>

                    {/* Footer Login Link */}
                    <div className="mt-10 text-center text-[16px] text-gray-800">
                        Already have an account?{" "}
                        <Link href="/login">
                            <span className="font-bold cursor-pointer buttonText transition-colors">Log In</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Marketing (5 parts) */}
            <div className="hidden lg:flex flex-[5] instantly-dark relative flex-col items-center justify-center p-12 overflow-hidden">
                {/* Wavy Logo Background Overlay */}
                <div className="absolute inset-0 bg-instantly-waves opacity-10 pointer-events-none" />

                <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
                    {/* Illustration */}
                    <img
                        src="/_next/static/images/getting-started-body.svg"
                        alt="Marketing Illustration"
                        className="w-[280px] h-auto mb-12 animate-fadeInUp"
                    />

                    {/* Marketing Text */}
                    <h2 className="text-[32px] font-bold text-white mb-2 leading-tight">
                        45,000+ clients
                    </h2>
                    <p className="text-[#006bff] text-[24px] font-bold mb-6">
                        are getting more replies!
                    </p>
                    <p className="text-gray-400 text-[16px] leading-[1.6] mb-12 px-4">
                        Unlock the power of effective outreach with our cutting-edge platform, and experience a surge in responses and engagement rates like never before.
                    </p>

                    {/* Testimonial */}
                    <div className="bg-white/5 backdrop-blur-md rounded-[16px] p-8 text-left border border-white/10 max-w-md">
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-white text-[15px] leading-[1.6] italic mb-6">
                            "Email outreach is one of the most effective ways to expand your business and gain new business. Instantly does this well; you can add unlimited email accounts and just does all the basics in the right way!"
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden">
                                <img src="/_next/static/images/testimonial-avatar.jpeg" alt="Alex Siderius" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-[14px]">Alex Siderius</h4>
                                <p className="text-gray-400 text-[12px]">CEO at Webaware</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative gradients from original UI */}
                <div className="absolute top-0 left-0 w-full h-full opacity-40">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-800/20 rounded-full blur-[100px]"></div>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center font-['Averta',_sans-serif]"><div className="text-foreground">Loading...</div></div>}>
            <SignupForm />
        </Suspense>
    )
}