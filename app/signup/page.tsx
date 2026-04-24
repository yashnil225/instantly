"use client"

import { useState, useEffect, Suspense, MouseEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Home } from "lucide-react"
import toast, { Toaster } from 'react-hot-toast'

function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [emailValid, setEmailValid] = useState(true)

    // Check for redirect from login page
    useEffect(() => {
        const emailParam = searchParams.get('email')
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam))
        }
    }, [searchParams])

    // Dynamic Validation & Password Visibility
    useEffect(() => {
        if (email.length > 0) {
            setShowPassword(true)
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            setEmailValid(isValid)
        } else {
            setShowPassword(false)
            setEmailValid(true)
        }
    }, [email])

    const createRipple = (event: MouseEvent<HTMLElement>) => {
        const button = event.currentTarget
        const ripple = document.createElement("span")
        const diameter = Math.max(button.clientWidth, button.clientHeight)
        const radius = diameter / 2

        ripple.style.width = ripple.style.height = `${diameter}px`
        ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`
        ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`
        ripple.classList.add("ripple-effect")

        const oldRipple = button.getElementsByClassName("ripple-effect")[0]
        if (oldRipple) {
            oldRipple.remove()
        }

        button.appendChild(ripple)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!termsAccepted) {
            toast.error("Please accept the Instantly terms of use and privacy policy.")
            return
        }

        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            toast.success("Welcome! Please check your email.")
        }, 1000)
    }

    const handleGoogleSignIn = (e: MouseEvent<HTMLButtonElement>) => {
        createRipple(e)
        setTimeout(() => {
            signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        }, 300)
    }

    return (
        <div className="auth-no-scroll flex font-['Averta',_sans-serif] bg-white select-none">
            <Toaster position="bottom-center" />

            {/* Left Side: Signup Form (7 parts) */}
            <div className="flex-[7] flex flex-col items-center justify-center p-6 md:p-12 bg-white relative h-full">
                <div className="w-full max-w-[320px] mx-auto animate-in fade-in duration-700">
                    <div className="space-y-4">
                        <h1 className="text-[28px] font-bold text-center text-slate-900 mb-2 tracking-tight">Create a new account</h1>

                        {/* Social Signups */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleSignIn}
                                className="social-btn ripple-container"
                                onMouseDown={createRipple}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" className="mt-[-1px]">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-[15px] font-semibold text-slate-700">Sign Up with Google</span>
                            </button>

                            <button
                                className="social-btn ripple-container"
                                onMouseDown={createRipple}
                            >
                                <img src="/apple-icon.png?v=1" alt="Apple" className="h-[20px] w-[20px] mt-[-2px]" />
                                <span className="text-[15px] font-semibold text-slate-700">Sign Up with Apple</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-[1px] bg-[#f1f3f4]"></div>
                            <span className="text-[11px] text-slate-400 font-bold tracking-widest">OR</span>
                            <div className="flex-1 h-[1px] bg-[#f1f3f4]"></div>
                        </div>

                        {/* Signup Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={`auth-input ${!emailValid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                                />
                                {!emailValid && (
                                    <p className="text-red-500 text-[11px] font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        Enter a valid email address
                                    </p>
                                )}
                            </div>

                            {showPassword && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
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
                            )}

                            {/* Terms Checkbox */}
                            <div className="flex items-start space-x-3 py-2">
                                <div className="flex items-center h-5 mt-1.5 ripple-container p-1 rounded-full">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        onMouseDown={createRipple}
                                        className="hollow-checkbox"
                                    />
                                </div>
                                <label htmlFor="terms" className="text-[13px] text-slate-500 leading-[1.6]">
                                    I agree to the Instantly <a href="https://instantly.ai/terms" target="_blank" rel="noreferrer" className="text-[#006bff] hover:text-[#0056d2] transition-colors font-semibold">Terms of Use</a> and<br />
                                    <a href="https://instantly.ai/privacy" target="_blank" rel="noreferrer" className="text-[#006bff] hover:text-[#0056d2] transition-colors font-semibold">Privacy policy</a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                onMouseDown={createRipple}
                                className="w-full py-[18px] bg-[#006bff] hover:bg-[#0056d2] text-white font-bold rounded-[12px] text-[16px] transition-all disabled:opacity-50 mt-2 shadow-[0_4px_12px_rgba(0,107,255,0.2)] ripple-container"
                            >
                                {loading ? "Processing..." : "Join Now"}
                            </button>
                        </form>
                    </div>

                    {/* Footer Login Link */}
                    <div className="mt-10 text-center text-[16px] text-slate-600">
                        Already have an account?{" "}
                        <Link href="/login">
                            <span className="font-bold cursor-pointer buttonText transition-colors">Log In</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Marketing (5 parts) */}
            <div className="hidden lg:flex flex-[5] bg-[#f1f9ff] relative flex-col items-center justify-center p-12 h-full overflow-hidden border-l border-[#eef2f6]">
                {/* Wavy Logo Background Overlay */}
                <div className="absolute inset-0 bg-instantly-waves opacity-100 pointer-events-none" />

                {/* Home Icon Button (Top Right) - 15px offset as requested */}
                <div className="absolute top-[15px] right-[15px] z-50">
                    <a
                        href="https://instantly-ai.vercel.app"
                        className="p-4 transition-all flex items-center justify-center"
                        title="Home"
                    >
                        <Home className="h-8 w-8 text-black" />
                    </a>
                </div>

                <div className="relative z-10 max-w-md text-center flex flex-col items-center">
                    {/* Illustration - FIXED PATH */}
                    <img
                        src="/images/auth/side-illustration.svg?v=1"
                        alt="Marketing Illustration"
                        className="w-[360px] h-auto mb-16 animate-in slide-in-from-bottom-4 duration-1000"
                    />

                    {/* Marketing Text */}
                    <h2 className="text-[34px] font-bold text-slate-900 mb-2 leading-tight tracking-tight">
                        45,000+ clients
                    </h2>
                    <p className="text-[#006bff] text-[26px] font-bold mb-8">
                        are getting more replies!
                    </p>
                    <p className="text-slate-500 text-[17px] leading-[1.8] max-w-sm font-medium">
                        Unlock the power of effective outreach with our cutting-edge platform, and experience a surge in responses and engagement rates like never before.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center font-['Averta',_sans-serif]"><div className="text-slate-900">Loading...</div></div>}>
            <SignupForm />
        </Suspense>
    )
}