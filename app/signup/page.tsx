"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"

// ── Exact toast messages from Instantly locale file (en/common.json) ──
const T = {
    signed_up:               "Signed up!",
    accept_privacy_policy:   "Please accept the Instantly terms of use and privacy policy.",
    google_sign_up_failed:   "Failed to Sign Up with Google",
    apple_sign_up_failed:    "Failed to Sign Up with Apple",
    account_exists:          "Account already exists",
    email_exists:            "Email already exists",
    password_length:         "Enter a password with at least 6 characters",
    email_invalid:           "Enter a valid email address",
    invalid_invitation:      "Invalid invitation.",
    invitation_error:        "Error accepting invitation.",
} as const

const POS = { position: "bottom-center" } as const

// Input style matching reference: padding 27px 24px, fontSize 16px
const INPUT_STYLE: React.CSSProperties = { padding: "27px 24px", fontSize: "16px" }

function isValidEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
}

function SignupForm() {
    const router       = useRouter()
    const searchParams = useSearchParams()

    const [email, setEmail]                 = useState("")
    const [password, setPassword]           = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [loading, setLoading]             = useState(false)

    // L27/S17 — field error states drive fadeIn/fadeOut class + inline error text
    const [emailError, setEmailError]         = useState(false)
    const [passwordError, setPasswordError]   = useState(false)

    // Progressive reveal — password appears after valid email typed
    const [showPassword, setShowPassword]     = useState(false)

    // S18 — iemail URL param: pre-fills email, disables field with opacity:0.5
    const iEmail = searchParams.get("iemail") ?? ""

    useEffect(() => {
        document.title = "Sign Up - Instantly"

        const errorParam = searchParams.get("error")
        const emailParam = searchParams.get("email")

        // Pre-fill from iemail param (S18)
        if (iEmail) {
            setEmail(iEmail)
            if (isValidEmail(iEmail)) setShowPassword(true)
        }

        if (errorParam === "no_account") {
            toast("No account found — create one below.", {
                icon: "ℹ️",
                duration: 4000,
                position: "bottom-center",
            })
            if (emailParam && !iEmail) {
                const decoded = decodeURIComponent(emailParam)
                setEmail(decoded)
                if (isValidEmail(decoded)) setShowPassword(true)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!termsAccepted) {
            toast.error(T.accept_privacy_policy, { ...POS, duration: 4000 })
            return
        }

        if (!isValidEmail(email)) {
            setEmailError(true)
            return
        }

        if (password.length < 6) {
            // S17: show inline error AND toast, matching reference
            setPasswordError(true)
            toast.error(T.password_length, POS)
            return
        }

        setLoading(true)

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            })
            const data = await res.json()

            if (res.status === 409 || (res.status === 400 && data.error === "User already exists")) {
                toast.loading(T.account_exists + " — signing you in…", POS)
                const signInResult = await signIn("credentials", { email, password, redirect: false })
                toast.dismiss()
                if (signInResult?.error) {
                    toast.error(T.email_exists, { ...POS, duration: 5000 })
                    return
                }
                toast.success(T.signed_up, POS)
                localStorage.setItem("instantly_auth", "true")
                router.push("/campaigns?welcome=true")
                router.refresh()
                return
            }

            if (!res.ok) {
                toast.error(data.error || T.invitation_error, { ...POS, duration: 5000 })
                return
            }

            const signInResult = await signIn("credentials", { email, password, redirect: false })
            toast.dismiss()

            if (signInResult?.error) {
                toast.error("Account created! Please log in.", { ...POS, duration: 4000 })
                router.push("/login")
            } else {
                toast.success(T.signed_up, { ...POS, duration: 3000 })
                localStorage.setItem("instantly_auth", "true")
                router.push("/campaigns?welcome=true")
                router.refresh()
            }
        } catch {
            toast.error(T.invitation_error, { ...POS, duration: 4000 })
        } finally {
            setLoading(false)
        }
    }

    /** SSO handlers check terms first — exactly matching reference behaviour */
    const handleGoogleSignIn = () => {
        if (!termsAccepted) {
            toast.error(T.accept_privacy_policy, { ...POS, duration: 4000 })
            return
        }
        try {
            signIn("google", { callbackUrl: "/campaigns?welcome=true" })
        } catch {
            toast.error(T.google_sign_up_failed, POS)
        }
    }

    const handleAppleSignIn = () => {
        if (!termsAccepted) {
            toast.error(T.accept_privacy_policy, { ...POS, duration: 4000 })
            return
        }
        toast.error(T.apple_sign_up_failed, POS)
    }

    // R5: Join Now disabled when email invalid or password too short or field errors active
    const joinNowDisabled = loading || emailError || passwordError

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

            {/* Back to home — top-right, exactly like Instantly */}
            <div className="instantly-back-to-home">
                <a
                    href="https://instantly-ai.vercel.app"
                    className="instantly-home-btn"
                    title="Back to Home"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </a>
            </div>

            <section
                className="instantly-auth-section"
                style={{ justifyContent: "center", alignItems: "flex-start" }}
            >
                {/* Fixed right-side illustration */}
                <div className="instantly-signup-illustration">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        id="instantly-signup-logo-vector"
                        src="/images/auth/pixeltrue-welcome.svg"
                        alt=""
                        style={{ height: "200px", width: "auto" }}
                    />
                    {/* Marketing copy — font sizes match reference exactly */}
                    <div className="instantly-signup-marketing" style={{ marginTop: "40px" }}>
                        <div
                            style={{ fontSize: "24px", lineHeight: "36px" }}
                            className="instantly-signup-marketing-title"
                        >
                            45,000+ clients
                        </div>
                        <div
                            style={{ fontSize: "24px", lineHeight: "36px" }}
                            className="instantly-signup-marketing-title"
                        >
                            are getting more replies!
                        </div>
                        <div
                            style={{ fontSize: "16px", lineHeight: "32px", marginTop: "16px" }}
                            className="instantly-signup-marketing-text"
                        >
                            Unlock the power of effective outreach with our cutting-edge platform, and
                            experience a surge in responses and engagement rates like never before.
                        </div>
                    </div>
                </div>

                {/* Left/center form */}
                <div className="instantly-auth-container">
                    {/* Logo — mb-5 (48px) matching reference */}
                    <div className="instantly-auth-logo-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" width={32} alt="Instantly" />
                    </div>

                    {/* Card */}
                    <div className="instantly-auth-card" style={{ maxWidth: "360px" }}>

                        {/* Heading — h3 fontSize:32px class="card-title text-center" */}
                        <h3
                            className="card-title text-center"
                            style={{ fontSize: "32px", marginBottom: "16px", color: "var(--auth-heading)", fontWeight: 700 }}
                        >
                            Create a new account
                        </h3>

                        {/* Google SSO — checks terms first */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="instantly-sso-btn"
                            id="signup-google-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginTop: "-1px" }}>
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Sign Up with Google
                        </button>

                        <button
                            type="button"
                            onClick={handleAppleSignIn}
                            className="instantly-sso-btn"
                            id="signup-apple-btn"
                            style={{ marginTop: "12px" }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: "-4px" }}>
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Sign Up with Apple
                        </button>

                        {/* Divider */}
                        <div className="instantly-divider">
                            <div className="instantly-divider-line" />
                            <span className="instantly-divider-text">OR</span>
                            <div className="instantly-divider-line" />
                        </div>

                        {/* Form — Email only, progressive password reveal */}
                        <form id="signupForm" onSubmit={handleSubmit}>

                            {/* Email field — S18: disabled + opacity:0.5 when iemail param present */}
                            <div className="position-relative mb-0">
                                <input
                                    type="email"
                                    className={`instantly-form-control${emailError ? " instantly-input-error" : ""}`}
                                    placeholder="Email"
                                    value={email}
                                    style={{
                                        ...INPUT_STYLE,
                                        // S18: iemail param = locked field, exactly as reference
                                        ...(iEmail ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                                    }}
                                    disabled={!!iEmail}
                                    onInput={(e) => {
                                        const v = (e.target as HTMLInputElement).value
                                        setEmail(v)
                                        if (isValidEmail(v)) {
                                            setEmailError(false)
                                            setShowPassword(true)
                                        }
                                    }}
                                    onBlur={() => {
                                        if (email.length > 0 && !isValidEmail(email)) setEmailError(true)
                                    }}
                                    autoComplete="email"
                                    required
                                />
                                {/* L27: fadeIn/fadeOut CSS animation on email error */}
                                <small className={`text-danger mb-0 mt-3 ${emailError ? "instantly-fadeIn" : "instantly-fadeOut"}`}>
                                    {T.email_invalid}
                                </small>
                            </div>

                            {/* Password — progressive reveal via maxHeight transition */}
                            <div
                                className="mt-3 position-relative mb-0"
                                style={{
                                    maxHeight: showPassword ? "120px" : "0",
                                    opacity: showPassword ? 1 : 0,
                                    overflow: "hidden",
                                    transition: "all 0.3s ease-in-out",
                                }}
                            >
                                <input
                                    type="password"
                                    className="instantly-form-control"
                                    placeholder="Password"
                                    value={password}
                                    style={INPUT_STYLE}
                                    onInput={(e) => {
                                        const v = (e.target as HTMLInputElement).value
                                        setPassword(v)
                                        // S17: inline error clears once valid
                                        if (v.length >= 6) setPasswordError(false)
                                    }}
                                    onBlur={() => {
                                        if (password.length > 0 && password.length < 6) setPasswordError(true)
                                    }}
                                    autoComplete="new-password"
                                />
                                {/* S17: inline password error — matches reference <small class="text-danger"> */}
                                <small className={`text-danger mb-0 mt-3 ${passwordError ? "instantly-fadeIn" : "instantly-fadeOut"}`}>
                                    {T.password_length}
                                </small>
                            </div>

                            {/* Terms — S19: checkbox padding:0 marginRight:12px, label fontSize:16px text-muted */}
                            <div className="instantly-terms-row">
                                <input
                                    type="checkbox"
                                    id="signup-terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="instantly-checkbox"
                                />
                                <label htmlFor="signup-terms" className="instantly-terms-label">
                                    I agree to the Instantly{" "}
                                    <a
                                        className="instantly-terms-link hover-underline"
                                        href="https://instantly.ai/terms"
                                        target="blank"
                                        rel="noopener noreferrer"
                                    >
                                        Terms of Use
                                    </a>
                                    {" "}and{" "}
                                    <a
                                        className="instantly-terms-link hover-underline"
                                        href="https://instantly.ai/privacy"
                                        target="blank"
                                        rel="noopener noreferrer"
                                    >
                                        Privacy policy
                                    </a>
                                </label>
                            </div>

                            {/* R5: disabled when field errors active, matching reference */}
                            <div className="mt-4 mb-0 text-center">
                                <button
                                    type="submit"
                                    form="signupForm"
                                    disabled={joinNowDisabled}
                                    className="instantly-submit-btn w-100"
                                    id="signup-submit-btn"
                                >
                                    {loading && <span className="instantly-btn-spinner" />}
                                    {loading ? "Creating account…" : "Join Now"}
                                </button>
                            </div>
                        </form>

                        {/* Login link */}
                        <p
                            className="mb-0 text-dark text-center"
                            style={{ fontSize: "16px", marginTop: "28px", cursor: "pointer" }}
                        >
                            Already have an account?{" "}
                            <Link href="/login" className="instantly-link-bold">Log In</Link>
                        </p>
                    </div>
                </div>
            </section>

            <style>{`.buttonText:hover { color: #006bff !important; }`}</style>
        </>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <section className="instantly-auth-section">
                <div style={{ color: "#006bff", fontFamily: "'Averta', sans-serif" }}>Loading…</div>
            </section>
        }>
            <SignupForm />
        </Suspense>
    )
}
