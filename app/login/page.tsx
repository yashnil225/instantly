"use client"

import { useState, useEffect, MouseEvent } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailValid, setEmailValid] = useState(true)
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState("")

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
        if (oldRipple) oldRipple.remove()
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
            const result = await signIn("credentials", { email, password, redirect: false })
            if (result?.error) {
                toast.error("Invalid username or password")
            } else {
                localStorage.setItem('instantly_auth', 'true')
                toast.success("Logged in!")
                setTimeout(() => { router.push("/campaigns?welcome=true"); router.refresh() }, 800)
            }
        } catch {
            toast.error("Error logging in! Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = (e: MouseEvent<HTMLButtonElement>) => {
        createRipple(e)
        setTimeout(() => { signIn("google", { callbackUrl: "/campaigns?welcome=true" }) }, 300)
    }

    return (
        <div className="auth-no-scroll relative flex items-start justify-center bg-white overflow-hidden h-screen">
            <Toaster position="bottom-center" />

            {/* Home Icon — 19px from right edge (Moved 2px further right) */}
            <div className="absolute top-[20px] right-[19px] z-50">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="flex items-center justify-center p-2 rounded-[8px]"
                    title="Home"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="2.0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </a>
            </div>

            {/* Main content — centered horizontally, padded from top per spec */}
            <div className="flex flex-col items-center w-full">

                {/* Top of Screen → Logo: 25px (Shifted up by 14px) */}
                <div style={{ marginTop: '40px' }}>
                    {/* Logo: 24px × 24px (Reduced) */}
                    <Logo style={{ width: '32px', height: '32px' }} />
                </div>

                {/* Logo → Social Buttons: 35px (Shifted up by 14px) */}
                <div style={{ marginTop: '45px', width: '358px' }} className="flex flex-col items-center">


                    <button
                        onClick={handleGoogleSignIn}
                        onMouseDown={createRipple}
                        className="social-btn ripple-container flex items-center justify-center gap-1.5"
                        style={{ width: '360px', height: '54px', borderRadius: '12px', padding: '0 24px', boxShadow: '0 3px 5px 0 rgb(222 222 222 / 30%)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-[16px] font-semibold text-slate-700 tracking-wide">Log In with Google</span>
                    </button>

                    {/* Between Social Buttons: 12px */}
                    <div style={{ height: '12px' }} />

                    <button
                        className="social-btn ripple-container flex items-center justify-center gap-1.5"
                        onMouseDown={createRipple}
                        style={{ width: '360px', height: '54px', borderRadius: '12px', padding: '0 24px', boxShadow: '0 3px 5px 0 rgb(222 222 222 / 30%)' }}
                    >
                        <svg viewBox="0 0 384 512" width="22" height="22" className="mt-[-4px]">
                            <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                        <span className="text-[16px] font-semibold text-slate-700 tracking-wide">Log In with Apple</span>
                    </button>

                    {/* Social Buttons → OR Divider: 24px */}
                    <div style={{ height: '16px' }} />

                    {/* OR Divider */}
                    <div className="flex items-center gap-4" style={{ width: '358px' }}>
                        <div className="flex-1 h-[1px] bg-[rgb(222,226,230)]"></div>
                        <span className="text-[12px] text-[#8492a6] font-semibold uppercase">OR</span>
                        <div className="flex-1 h-[1px] bg-[rgb(222,226,230)]"></div>
                    </div>

                    {/* OR Divider → Email Field: 24px */}
                    <div style={{ height: '16px' }} />

                    {/* Email Input: 358px W × 54px H */}
                    <div
                        className="relative transition-all duration-300"
                        style={{ width: '358px', marginBottom: !emailValid ? '12px' : '0px' }}
                    >
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '360px', height: '58px', borderRadius: '8px', padding: '27px 24px', color: 'rgb(194,198,201)', fontWeight: '400' }}
                            className={`auth-input ${!emailValid ? 'border-red-400 focus:border-red-400' : ''}`}
                        />
                        {!emailValid && (
                            <p className="absolute left-1 top-[58px] text-red-500 text-[11px] font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                Enter a valid email address
                            </p>
                        )}
                    </div>

                    {/* Email Field → Password Field: 16px */}
                    <div style={{ height: '16px' }} />

                    {/* Password Input: 358px W × 54px H */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '360px', height: '58px', borderRadius: '8px', padding: '27px 24px', color: 'rgb(194,198,201)', fontWeight: '400' }}
                        className="auth-input"
                    />

                    {/* Password Field → Login Button: 36px */}
                    <div style={{ height: '36px' }} />

                    {/* Primary Action Button: 360px W × 58px H | 8px radius */}
                    <button
                        type="submit"
                        disabled={loading}
                        onMouseDown={createRipple}
                        onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
                        style={{ width: '360px', height: '58px', borderRadius: '12px', boxShadow: '0 3px 6px 0 rgba(0, 107, 255, 0.3)' }}
                        className="bg-[#006bff] hover:bg-[#0056d2] text-white font-semibold text-[16px] transition-all disabled:opacity-50 ripple-container"
                    >
                        {loading ? "Logging in..." : "Log\u00A0\u00A0In"}
                    </button>

                    {/* Login Button → Forgot Password: 44px (Increased by 28px to keep Forgot Password in place) */}
                    <div style={{ height: '14px' }} />

                    {/* Forgot Password */}
                    <button
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[14px] text-[rgb(153,165,181)] hover:text-[#006bff] transition-colors cursor-pointer font-medium"
                    >
                        Forgot password?
                    </button>

                    {/* Forgot Password → Footer: 36px */}
                    <div style={{ height: '36px' }} />

                    {/* Footer */}
                    <div className="text-center text-[16px] text-[rgb(83,94,108)]">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup">
                            <span className="buttonText">Sign Up</span>
                        </Link>
                    </div>

                    {/* Footer → Bottom of Screen: 57px */}
                    <div style={{ height: '57px' }} />
                </div>
            </div>

            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setIsForgotModalOpen(false)}>
                    {/* Backdrop — 50% black, no blur, matching reference */}
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="relative w-full max-w-[500px] bg-white overflow-hidden mx-4"
                        style={{ borderRadius: '0.3rem', border: '1px solid rgba(0,0,0,0.2)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header — 1rem padding, border-bottom, flex-start alignment */}
                        <div
                            className="flex items-start justify-between"
                            style={{ padding: '1rem', borderBottom: '1px solid #dee2e6' }}
                        >
                            <h5 className="text-[1.25rem] font-semibold text-[#212529] leading-[1.5] mb-0">Reset your password</h5>
                            <button
                                onClick={() => setIsForgotModalOpen(false)}
                                className="text-[1.5rem] font-semibold text-black opacity-50 hover:opacity-75 leading-[1]"
                                style={{ padding: '1rem', margin: '-1rem -1rem -1rem auto', background: 'none', border: 'none', cursor: 'pointer' }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body — 1rem padding */}
                        <div style={{ padding: '1rem' }}>
                            <p className="text-[16px] text-black font-normal mb-[1rem] leading-[1.6]">
                                Hi there! Please submit your registered email address and we&apos;ll send you an email with your password reset link!
                            </p>

                            <input
                                type="email"
                                placeholder="Email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full bg-white text-[1rem] text-[#495057] transition-colors placeholder:text-[#6c757d]"
                                style={{
                                    padding: '0.7rem 0.75rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.25rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#80bdff'; e.target.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,.25)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#ced4da'; e.target.style.boxShadow = 'none'; }}
                                required
                            />

                            {/* Buttons — right-aligned, mt-4 mb-3 */}
                            <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => setIsForgotModalOpen(false)}
                                    className="text-[1rem] font-normal transition-colors hover:bg-[#f8f9fc]"
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        minWidth: '98px',
                                        borderRadius: '0.25rem',
                                        border: '1px solid #dee2e6',
                                        backgroundColor: 'transparent',
                                        color: '#3c4858',
                                        cursor: 'pointer',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        toast.success("Reset link sent!")
                                        setIsForgotModalOpen(false)
                                    }}
                                    className="text-[1rem] font-normal text-white transition-all hover:bg-[#0056cc]"
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        minWidth: '98px',
                                        borderRadius: '0.25rem',
                                        backgroundColor: '#006bff',
                                        border: '1px solid #006bff',
                                        boxShadow: '0 3px 5px 0 rgba(0, 107, 255, 0.3)',
                                        cursor: 'pointer',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}