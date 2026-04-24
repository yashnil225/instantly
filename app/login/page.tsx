"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, Apple } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in according to session
    useEffect(() => {
        if (status === "authenticated") {
            router.push('/campaigns')
        }
    }, [status, router])

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

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            await signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        } catch (error) {
            toast.error("Failed to Log In with Google")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#f8f9fa] font-['Averta',_sans-serif] overflow-hidden">
            <Toaster position="bottom-center" />
            
            {/* Full Page Wavy Background Overlay */}
            <div className="absolute inset-0 bg-instantly-waves opacity-100 pointer-events-none" />
            
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-50">
                <a
                    href="https://instantly.ai"
                    className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all border border-[#dee2e6] flex items-center justify-center shadow-sm"
                    title="Home"
                >
                    <Home className="h-5 w-5 text-[#8492a6]" />
                </a>
            </div>

            <div className="relative z-10 w-full max-w-[360px] px-6 py-12 flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-12 flex flex-col items-center gap-2">
                    <Logo style={{ width: '32px', height: '32px' }} />
                </div>

                {/* Login Form Container */}
                <div className="w-full bg-white rounded-[12px] p-0 shadow-none">
                    <div className="space-y-6">
                        {/* Social Login Buttons */}
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
                                <span className="text-[15px] font-medium text-gray-700">Log In with Google</span>
                            </button>
                            
                            <button className="social-btn">
                                <img src="/apple-icon.png" alt="Apple" className="h-[20px] w-[20px] mt-[-2px]" />
                                <span className="text-[15px] font-medium text-gray-700">Log In with Apple</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-[1px] bg-[#dee2e6]"></div>
                            <span className="text-[12px] text-[#8492a6] font-medium tracking-wider">OR</span>
                            <div className="flex-1 h-[1px] bg-[#dee2e6]"></div>
                        </div>

                        {/* Credentials Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-[16px] bg-[#006bff] hover:bg-[#0056d2] text-white font-bold rounded-[12px] text-[16px] transition-all disabled:opacity-50 mt-2 shadow-[0_4px_12px_rgba(0,107,255,0.15)]"
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </button>
                        </form>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <Link href="/forgot-password">
                                <span className="text-[14px] text-gray-500 hover:text-[#006bff] transition-colors cursor-pointer buttonText">
                                    Forgot password?
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Sign Up Link */}
                <div className="mt-10 text-center text-[16px] text-gray-800">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup">
                        <span className="font-bold cursor-pointer buttonText transition-colors">Sign Up</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}