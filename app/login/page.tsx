"use client"

import { useState, useEffect, MouseEvent } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailValid, setEmailValid] = useState(true)

    // Redirect if already logged in according to session
    useEffect(() => {
        if (status === "authenticated") {
            router.push('/campaigns')
        }
    }, [status, router])

    // Dynamic Validation
    useEffect(() => {
        if (email.length > 0) {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            setEmailValid(isValid)
        } else {
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
        setLoading(true)

        try {
            const checkResponse = await fetch('/api/auth/check-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const checkData = await checkResponse.json()

            if (!checkData.exists) {
                router.push('/signup?error=no_account&email=' + encodeURIComponent(email))
                return
            }

            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Invalid username or password")
            } else {
                localStorage.setItem('instantly_auth', 'true')
                toast.success("Logged in!")
                setTimeout(() => {
                    router.push("/campaigns?welcome=true")
                    router.refresh()
                }, 800)
            }
        } catch (error) {
            toast.error("Error logging in! Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = (e: MouseEvent<HTMLButtonElement>) => {
        createRipple(e)
        setTimeout(() => {
            signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        }, 300)
    }

    return (
        <div className="auth-no-scroll relative flex items-center justify-center bg-white font-['Averta',_sans-serif] select-none">
            <Toaster position="bottom-center" />
            
            {/* Home Icon Button (Top Right) - Even Larger and more Cornered */}
            <div className="absolute top-[15px] right-[15px] z-50">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="transition-all flex items-center justify-center p-2.5 hover:bg-slate-50 rounded-full"
                    title="Home"
                >
                    <Home className="h-9 w-9 text-black" />
                </a>
            </div>

            <div className="relative z-10 w-full max-w-[420px] px-6 py-12 flex flex-col items-center animate-in fade-in duration-700">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center gap-2">
                    <Logo style={{ width: '48px', height: '48px' }} />
                </div>

                {/* Login Form Container */}
                <div className="w-full bg-transparent p-0">
                    <div className="space-y-5">
                        {/* Social Login Buttons */}
                        <div className="space-y-2.5">
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
                                <span className="text-[15px] font-semibold text-slate-700">Log In with Google</span>
                            </button>
                            
                            <button 
                                className="social-btn ripple-container"
                                onMouseDown={createRipple}
                            >
                                <svg viewBox="0 0 384 512" width="18" height="18" className="mt-[-2px] text-black">
                                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                                </svg>
                                <span className="text-[15px] font-semibold text-slate-700">Log In with Apple</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-1">
                            <div className="flex-1 h-[1px] bg-[#eef2f6]"></div>
                            <span className="text-[11px] text-[#94a3b8] font-bold tracking-widest uppercase">OR</span>
                            <div className="flex-1 h-[1px] bg-[#eef2f6]"></div>
                        </div>

                        {/* Credentials Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
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
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="auth-input"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                onMouseDown={createRipple}
                                className="w-full py-[18px] bg-[#006bff] hover:bg-[#0056d2] text-white font-bold rounded-[12px] text-[16px] transition-all disabled:opacity-50 mt-3 ripple-container"
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </button>
                        </form>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <Link href="/forgot-password">
                                <span className="text-[14px] text-slate-400 hover:text-[#006bff] transition-colors cursor-pointer font-medium font-['Averta',_sans-serif]">
                                    Forgot password?
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Sign Up Link */}
                <div className="mt-6 text-center text-[16px] text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup">
                        <span className="font-bold cursor-pointer buttonText transition-colors">Sign Up</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}