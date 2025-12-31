"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Home } from "lucide-react"

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
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                if (result.error === "CredentialsSignin") {
                    setError("invalid_credentials")
                } else {
                    setError("general_error")
                }
            } else {
                // Persist auth state
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

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/campaigns?welcome=true" })
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative">
            {/* Home Icon */}
            <Link
                href="/"
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                title="Home"
            >
                <Home className="h-5 w-5" />
            </Link>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    <Zap className="h-6 w-6 text-blue-500 fill-blue-500" />
                    <span className="text-xl font-semibold text-blue-500">Instantly</span>
                </div>

                {/* Login Card */}
                <div className="space-y-6">
                    <h1 className="text-2xl font-semibold text-white text-center">Login</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3a3a3a] transition-colors"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3a3a3a] transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center space-y-1">
                                {error === "invalid_credentials" ? (
                                    <>
                                        <p>Invalid email or password.</p>
                                        <p className="text-gray-400">
                                            Don't have an account?{" "}
                                            <Link href="/signup" className="text-blue-400 hover:text-blue-300 underline">
                                                Sign up here
                                            </Link>
                                        </p>
                                    </>
                                ) : (
                                    <p>An error occurred. Please try again.</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log In"}
                                {!loading && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                )}
                            </button>
                            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2a2a2a]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0a0a0a] text-gray-500">OR</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-3"
                            onClick={handleGoogleSignIn}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Log In with Google
                        </button>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-400">
                    Don&apos;t have an account? <Link href="/signup" className="text-white hover:underline">Sign Up</Link>
                </div>
            </div>
        </div>
    )
}
