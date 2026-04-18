"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"


// ── Exact toast messages from Instantly locale file (en/common.json) ──
const T = {
    logged_in:                    "Logged in!",
    invalid_credentials:          "Invalid username or password",
    login_error:                  "Error logging in! Please try again.",
    google_login_failed:          "Failed to Log In with Google",
    apple_login_failed:           "Failed to Log In with Apple",
    password_reset_sent:          "Password reset email sent!",
    password_reset_error:         "Error sending password reset email! Please try again.",
    verification_sent:            "Verification email sent!",
    verification_error_support:   "Error sending verification email! Please contact support.",
    verification_error_retry:     "Error sending verification email! Please try again.",
    invalid_email:                "Enter a valid email address",
    no_account:                   "No account found with this email.",
} as const

const POS = { position: "bottom-center" } as const

// Input style matching Instantly reference: padding 27px 24px, fontSize 16px
const INPUT_STYLE: React.CSSProperties = { padding: "27px 24px", fontSize: "16px" }



export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()

    const [email, setEmail]           = useState("")
    const [password, setPassword]     = useState("")
    const [loading, setLoading]       = useState(false)
    // L27: track email error separately to drive fadeIn/fadeOut CSS class
    const [emailError, setEmailError] = useState(false)
    const [showForgot, setShowForgot] = useState(false)
    const [forgotEmail, setForgotEmail]     = useState("")
    const [forgotLoading, setForgotLoading] = useState(false)



    // L7: set page title matching reference "Log In - Instantly"
    useEffect(() => {
        document.title = "Log In - Instantly"
    }, [])

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/campaigns")
        }
    }, [status, router])

    function isValidEmail(val: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
    }

    // L36: toggle modal — resets state, no fade animation (reference fade:false)
    const toggleForgotModal = () => {
        setShowForgot(v => !v)
        setForgotEmail("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isValidEmail(email)) {
            setEmailError(true)
            return
        }

        if (password.length < 6) {
            toast.error(T.invalid_credentials, POS)
            return
        }

        setLoading(true)

        try {
            const checkResponse = await fetch("/api/auth/check-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            })
            const checkData = await checkResponse.json()

            if (!checkData.exists) {
                toast.error(T.no_account, { ...POS, duration: 4000 })
                setTimeout(() => {
                    router.push("/signup?error=no_account&email=" + encodeURIComponent(email))
                }, 1500)
                return
            }

            const result = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            })

            if (result?.error) {
                toast.error(
                    result.error === "CredentialsSignin" ? T.invalid_credentials : T.login_error,
                    { ...POS, duration: 4000 }
                )
            } else {
                toast.success(T.logged_in, { ...POS, duration: 2000 })
                localStorage.setItem("instantly_auth", "true")
                router.push("/campaigns?welcome=true")
                router.refresh()
            }
        } catch {
            toast.error(T.login_error, POS)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            await signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        } catch {
            toast.error(T.google_login_failed, POS)
        }
    }

    const handleAppleSignIn = () => {
        toast.error(T.apple_login_failed, POS)
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValidEmail(forgotEmail)) {
            toast.error(T.invalid_email, POS)
            return
        }
        setForgotLoading(true)
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
            })
            if (res.ok) {
                toast.success(T.password_reset_sent, { ...POS, duration: 4000 })
                toggleForgotModal()
            } else {
                toast.error(T.password_reset_error, POS)
            }
        } catch {
            toast.error(T.password_reset_error, POS)
        } finally {
            setForgotLoading(false)
        }
    }

    return (
        <>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        borderRadius: "8px",
                        fontFamily: "'Averta', 'Inter', sans-serif",
                        fontSize: "14px",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.12), 0 3px 3px rgba(0,0,0,0.06)",
                        padding: "12px 16px",
                    },
                    success: { iconTheme: { primary: "#006bff", secondary: "#fff" } },
                }}
            />



            {/* Back to home — top-right, matching Instantly's back-to-home placement */}
            <div className="instantly-back-to-home">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="btn btn-icon btn-soft-primary"
                    title="Back to Home"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icons">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </a>
            </div>

            <section className="instantly-auth-section">
                <div className="instantly-bg-overlay" />

                <div className="instantly-auth-container">
                    {/* Logo — mb-5 (48px) above card, matching reference */}
                    <div className="instantly-auth-logo-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" width={40} height={40} alt="Instantly" />
                    </div>

                    {/* Card — 360px max-width matching Instantly */}
                    <div className="instantly-auth-card" style={{ maxWidth: "360px" }}>

                        {/* Google SSO */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="instantly-sso-btn"
                            id="login-google-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginTop: "-1px" }}>
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Log In with Google
                        </button>

                        <button
                            type="button"
                            onClick={handleAppleSignIn}
                            className="instantly-sso-btn"
                            id="login-apple-btn"
                            style={{ marginTop: "12px" }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: "-4px" }}>
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Log In with Apple
                        </button>

                        {/* Divider */}
                        <div className="instantly-divider">
                            <div className="instantly-divider-line" />
                            <span className="instantly-divider-text">OR</span>
                            <div className="instantly-divider-line" />
                        </div>

                        {/* Credentials form */}
                        <form id="loginForm" onSubmit={handleSubmit}>
                            <div className="mb-3 position-relative">
                                <input
                                    type="email"
                                    className={`instantly-form-control${emailError ? " instantly-input-error" : ""}`}
                                    placeholder="Email"
                                    name="email"
                                    autoComplete="email"
                                    style={INPUT_STYLE}
                                    value={email}
                                    onInput={(e) => {
                                        const v = (e.target as HTMLInputElement).value
                                        setEmail(v)
                                        if (isValidEmail(v)) setEmailError(false)
                                    }}
                                    onBlur={() => {
                                        if (email.length > 0) setEmailError(!isValidEmail(email))
                                    }}
                                />
                                {/* L27: fadeIn/fadeOut CSS animation on email error — matches reference */}
                                <small className={`text-danger mb-0 mt-3 ${emailError ? "instantly-fadeIn" : "instantly-fadeOut"}`}>
                                    {T.invalid_email}
                                </small>
                            </div>

                            <div className="mt-3 position-relative mb-0">
                                <input
                                    type="password"
                                    className="instantly-form-control"
                                    placeholder="Password"
                                    name="password"
                                    autoComplete="current-password"
                                    style={INPUT_STYLE}
                                    value={password}
                                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                                />
                            </div>

                            <div className="mt-4 mb-0 text-center">
                                <button
                                    type="submit"
                                    form="loginForm"
                                    disabled={loading}
                                    className="instantly-submit-btn w-100"
                                    id="login-submit-btn"
                                >
                                    {/* L33: spinner matches reactstrap sm spinner — CSS driven */}
                                    {loading && <span className="instantly-btn-spinner" />}
                                    {loading ? "Signing in…" : "Log In"}
                                </button>
                            </div>

                            {/* Forgot password — below submit, text-muted, cursor pointer */}
                            <p className="mb-0 mt-3 text-center">
                                <small
                                    className="instantly-forgot-link buttonText"
                                    onClick={toggleForgotModal}
                                    style={{ cursor: "pointer", fontSize: "14px" }}
                                >
                                    Forgot password?
                                </small>
                            </p>
                        </form>

                        {/* Sign up link */}
                        <p
                            className="mb-0 text-dark text-center"
                            style={{ fontSize: "16px", marginTop: "28px", cursor: "pointer" }}
                        >
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="instantly-link-bold">Sign Up</Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* L36: Forgot password modal — no fade (reference fade:false), instant appear */}
            {showForgot && (
                <div
                    className="instantly-modal-overlay"
                    onClick={toggleForgotModal}
                    style={{ animation: "none" }}
                >
                    <div className="instantly-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="instantly-modal-header">
                            <span>Reset Password</span>
                            <button onClick={toggleForgotModal} className="instantly-modal-close">✕</button>
                        </div>
                        <form id="forgotPasswordForm" onSubmit={handleForgotPassword}>
                            <p style={{ fontSize: "14px", color: "var(--auth-text-muted)", marginBottom: "16px" }}>
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                            <input
                                type="email"
                                className="instantly-form-control"
                                placeholder="Email"
                                name="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                style={{ ...INPUT_STYLE, marginBottom: "16px" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={toggleForgotModal}
                                    className="instantly-btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="instantly-submit-btn"
                                    style={{ minWidth: "80px" }}
                                >
                                    {forgotLoading && <span className="instantly-btn-spinner" />}
                                    {forgotLoading ? "" : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`.buttonText:hover { color: #006bff !important; }`}</style>
        </>
    )
}
