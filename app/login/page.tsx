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

                {/* Top of Screen → Logo: 45px */}
                <div style={{ marginTop: '45px' }}>
                    {/* Logo: 24px × 24px (Reduced) */}
                    <Logo style={{ width: '32px', height: '32px' }} />
                </div>

                {/* Logo → Social Buttons: 48px (Lowered form content by 1px per request) */}
                <div style={{ marginTop: '48px', width: '358px' }} className="flex flex-col items-center">


                    <button
                        onClick={handleGoogleSignIn}
                        onMouseDown={createRipple}
                        className="social-btn ripple-container flex items-center justify-center gap-1"
                        style={{ width: '360px', height: '54px', borderRadius: '12px', padding: '0 24px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="rgb(255, 193, 7)" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="rgb(255, 61, 0)" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="rgb(88, 176, 75)" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="rgb(25, 118, 210)" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        <span className="text-[16px] font-semibold text-slate-700 tracking-wide">Log In with Google</span>
                    </button>

                    {/* Between Social Buttons: 12px */}
                    <div style={{ height: '12px' }} />

                    <button
                        className="social-btn ripple-container flex items-center justify-center gap-1"
                        onMouseDown={createRipple}
                        style={{ width: '360px', height: '54px', borderRadius: '12px', padding: '0 24px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' }}
                    >
                        <svg viewBox="0 0 384 512" width="22" height="22" className="mt-[-4px]">
                            <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                        <span className="text-[16px] font-semibold text-slate-700 tracking-wide">Log In with Apple</span>
                    </button>

                    {/* Social Buttons → OR Divider */}
                    <div style={{ height: '17px' }} />

                    {/* OR Divider */}
                    <div className="flex items-center gap-4" style={{ width: '358px' }}>
                        <div className="flex-1 h-[1px] bg-[rgb(222,226,230)]"></div>
                        <span className="text-[12px] text-[#8492a6] uppercase" style={{ fontWeight: '400 !important' } as any}>OR</span>
                        <div className="flex-1 h-[1px] bg-[rgb(222,226,230)]"></div>
                    </div>

                    {/* OR Divider → Email Field */}
                    <div style={{ height: '14px' }} />

                    {/* Email Input: 358px W × 54px H */}
                    <div
                        className="relative transition-all duration-300"
                        style={{ width: '360px', marginBottom: !emailValid ? '12px' : '0px' }}
                    >
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '362px', height: '56px', borderRadius: '6px', padding: '26px 24px', color: 'rgb(194,198,201)', fontWeight: '400' }}
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
                        style={{ width: '360px', height: '56px', borderRadius: '6px', padding: '26px 24px', color: 'rgb(194,198,201)', fontWeight: '400' }}
                        className="auth-input"
                    />

                    {/* Password Field → Login Button: 24px (Decreased further) */}
                    <div style={{ height: '24px' }} />

                    {/* Primary Action Button: 360px W × 58px H | 8px radius */}
                    <button
                        type="submit"
                        disabled={loading}
                        onMouseDown={createRipple}
                        onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
                        style={{ width: '360px', height: '58px', borderRadius: '12px', boxShadow: '0 3px 6px 0 rgba(0, 107, 255, 0.3)', letterSpacing: '0.3px' }}
                        className="bg-[#006bff] hover:bg-[#0056d2] text-white font-semibold text-[16px] transition-all disabled:opacity-50 ripple-container"
                    >
                        {loading ? "Logging in..." : "Log\u00A0In"}
                    </button>

                    {/* Login Button → Forgot Password: 18px (Lowered per request) */}
                    <div style={{ height: '18px' }} />

                    {/* Forgot Password */}
                    <button
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[14px] text-[rgb(164,161,172)] hover:text-[#006bff] transition-colors cursor-pointer"
                        style={{ fontWeight: '400 !important' } as any}
                    >
                        Forgot password?
                    </button>

                    {/* Forgot Password → Footer: 31px (Lowered by 1px per request) */}
                    <div style={{ height: '31px' }} />

                    {/* Footer */}
                    <div className="text-center text-[16px] text-[rgb(83,94,108)] font-normal">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup">
                            <span className="buttonText" style={{ fontWeight: '700 !important' } as any}>Sign Up</span>
                        </Link>
                    </div>

                    {/* Footer → Bottom of Screen: 46px (Balanced with footer lowering) */}
                    <div style={{ height: '46px' }} />
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