"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, Apple } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in according to session
    useEffect(() => {
        if (status === "authenticated") {
            router.push('/campaigns')
        }
    }, [status, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
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
                setError(result.error === "CredentialsSignin" ? "invalid_credentials" : "general_error")
            } else {
                localStorage.setItem('instantly_auth', 'true')
                router.push("/campaigns?welcome=true")
                router.refresh()
            }
        } catch (error) {
            setError("general_error")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError("")
        try {
            await signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        } catch (error) {
            console.error("Google sign-in exception:", error)
            setError("google_error")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex font-['Averta',_sans-serif]">
            {/* Home Icon Redirect */}
            <div className="back-to-home">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 flex items-center justify-center backdrop-blur-sm"
                    title="Home"
                >
                    <Home className="h-5 w-5 text-white" />
                </a>
            </div>

            {/* Left Side: Illustration & Marketing */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-12 instantly-dark relative overflow-hidden">
                <div className="relative z-10 max-w-xl text-center">
                    <img 
                        src="/images/auth/side-illustration.svg" 
                        alt="Outreach Illustration" 
                        className="w-full h-auto mb-10 animate-fadeInUp"
                    />
                    <h2 className="text-4xl font-semibold text-white mb-4 leading-tight">
                        Ready to 10x your outreach?
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Scale your outreach campaigns with ease and automate your entire sales funnel.
                    </p>
                </div>
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[100px]"></div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f8f9fa]">
                <div className="w-full max-w-[360px] mx-auto">
                    {/* Logo */}
                    <div className="flex justify-center items-center gap-2 mb-8">
                        <Logo size="lg" />
                        <span className="text-2xl font-semibold text-[#006bff]">Instantly</span>
                    </div>

                    <div className="instantly-card p-4 shadow-[0_3px_5px_0_rgba(222,222,222,0.3)] bg-white rounded-[12px]">
                        <div className="space-y-6">
                            {/* Social Logins */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#dee2e6] rounded-[12px] bg-white text-[15px] font-medium transition-all hover:bg-gray-50 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Log in with Google
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#dee2e6] rounded-[12px] bg-white text-[15px] font-medium transition-all hover:bg-gray-50 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                    <Apple className="h-5 w-5 -mt-1" />
                                    Log in with Apple
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-[1px] bg-[#dee2e6]"></div>
                                <span className="text-[12px] text-[#8492a6] font-medium uppercase">or</span>
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
                                        className="w-full px-6 py-[14px] bg-white border border-[#dee2e6] rounded-[8px] text-[16px] focus:outline-none focus:border-[#006bff] transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-6 py-[14px] bg-white border border-[#dee2e6] rounded-[8px] text-[16px] focus:outline-none focus:border-[#006bff] transition-all"
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center">
                                        {error === "invalid_credentials" ? "Invalid email or password." : "An error occurred."}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#006bff] hover:bg-[#0056d2] text-white font-semibold rounded-[12px] text-[15px] transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(0,107,255,0.2)]"
                                >
                                    {loading ? "Logging in..." : "Log In"}
                                </button>
                            </form>

                            <div className="text-center">
                                <Link href="/forgot-password">
                                    <span className="text-[14px] text-gray-500 hover:text-[#006bff] transition-colors cursor-pointer">
                                        Forgot password?
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-[16px]">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup">
                            <span className="font-bold text-gray-900 hover:text-[#006bff] cursor-pointer">Sign Up</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .back-to-home {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    z-index: 50;
                }
            `}</style>
        </div>
    )
}
