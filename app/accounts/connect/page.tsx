"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Check, AlertCircle, Video } from "lucide-react"

// Provider Logos/Icons
const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" className="h-10 w-10"><path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.4H12v4.5h6.6c-.3 1.5-1.1 2.8-2.3 3.6v3h3.7c2.2-2 3.4-5 3.4-8.7z" /><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-3l-3.7-3c-1.1.7-2.4 1.1-4.2 1.1-3.2 0-5.9-2.2-6.9-5.2H1.3v3.2C3.3 21.1 7.4 24 12 24z" /><path fill="#FBBC05" d="M5.1 13.9c-.3-.8-.4-1.6-.4-2.5 0-.8.1-1.7.4-2.5V5.7H1.3C.5 7.2 0 8.9 0 10.6c0 1.8.5 3.5 1.3 5l3.8-3.1v1.4z" /><path fill="#EA4335" d="M12 4.6c1.8 0 3.3.6 4.6 1.8L19.9 3c-2.1-2-4.9-3.2-7.9-3.2C7.4 0 3.3 2.9 1.3 7l3.8 3.1c1-3 3.7-5.2 6.9-5.2z" /></svg>
)

export default function ConnectAccountPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    // Params
    const paramProvider = searchParams.get('provider') || ''
    const paramEmail = searchParams.get('email') || ''
    const paramMode = searchParams.get('mode') // 'reconnect' or null
    const paramAccountId = searchParams.get('accountId') // for updates

    const [isConnecting, setIsConnecting] = useState(false)
    const [step, setStep] = useState(paramProvider ? (paramProvider === 'google' ? 'google-options' : 'provider') : 'provider')
    const [provider, setProvider] = useState(paramProvider || '')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState(paramEmail)
    const [appPassword, setAppPassword] = useState('')


    const handleBack = () => {
        if (step === 'google-app-pw-form') setStep('google-app-pw-instructions')
        else if (step === 'google-app-pw-instructions') setStep('google-options')
        else if (step === 'google-options') setStep('provider')
        else router.back()
    }

    const handleOAuth = () => {
        window.location.href = '/api/auth/google/signin'
    }

    const handleConnect = async () => {
        if (!email || !appPassword) {
            toast({ title: "Error", description: "Email and App Password are required", variant: "destructive" })
            return
        }

        setIsConnecting(true)

        try {
            const url = paramAccountId ? `/api/accounts/${paramAccountId}` : '/api/accounts'
            const method = paramAccountId ? 'PATCH' : 'POST'

            const payload: any = {
                email,
                firstName,
                lastName,
                provider: 'google',
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpUser: email,
                smtpPass: appPassword.replace(/\s/g, ''),
                imapHost: 'imap.gmail.com',
                imapPort: 993,
                imapUser: email,
                imapPass: appPassword.replace(/\s/g, '')
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast({ title: "Success", description: paramAccountId ? "Account updated successfully" : "Account connected successfully" })
                router.push('/accounts')
            } else {
                const data = await res.json()
                toast({ title: "Connection Failed", description: data.error || "Could not verify credentials", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative">

            {/* Back Button - Top Left Fixed */}
            <div className="absolute top-8 left-8">
                <Button variant="ghost" className="text-gray-400 hover:text-white gap-2 pl-0" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            <div className="w-full max-w-[900px] animate-in fade-in slide-in-from-bottom-4 duration-500">

                {step === 'provider' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-semibold">Connect a new account</h1>
                            <p className="text-gray-400">Select an email provider to continue.</p>
                        </div>
                        <div className="grid gap-3 max-w-md mx-auto pt-4">
                            <Button
                                variant="outline"
                                className="h-16 bg-[#111] border-[#222] hover:bg-[#1a1a1a] hover:border-[#333] justify-start px-6 gap-4"
                                onClick={() => { setProvider('google'); setStep('google-options') }}
                            >
                                <GoogleLogo />
                                <span className="text-lg font-medium">Google / G-Suite</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-16 bg-[#111] border-[#222] hover:bg-[#1a1a1a] hover:border-[#333] justify-start px-6 gap-4 opacity-80"
                                onClick={() => { setProvider('microsoft'); alert("Microsoft flow coming soon") }}
                            >
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <svg viewBox="0 0 23 23" className="w-full h-full">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                </div>
                                <span className="text-lg font-medium">Microsoft / Office 365</span>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'google-options' && (
                    <div className="space-y-8 text-center max-w-2xl mx-auto">
                        <div className="space-y-2">
                            <div className="flex justify-center mb-4 scale-125">
                                <GoogleLogo />
                            </div>
                            <h1 className="text-xl font-semibold">Connect Your Google Account</h1>
                            <p className="text-gray-400">Gmail / G-Suite</p>
                        </div>

                        <p className="text-blue-400">Select a connection option</p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Option 1: OAuth */}
                            <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-xl p-6 text-left space-y-4 relative group cursor-pointer transition-all" onClick={handleOAuth}>
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold text-lg">Option 1: OAuth</h3>
                                </div>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-gray-500" /> Easier to setup</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-gray-500" /> More stable and less disconnects</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-gray-500" /> Available for GSuite accounts</div>
                                </div>
                                <div className="pt-2 flex justify-center">
                                    <span className="bg-[#1a3f30] text-[#4ade80] text-[10px] uppercase font-bold px-3 py-1 rounded-full">Recommended</span>
                                </div>
                            </div>

                            {/* Option 2: App Password */}
                            <div
                                className="bg-[#111] border border-[#222] hover:border-blue-900/50 hover:bg-[#151515] rounded-xl p-6 text-left space-y-4 relative cursor-pointer transition-all"
                                onClick={() => setStep('google-app-pw-instructions')}
                            >
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold text-lg text-blue-500">Option 2: App Password</h3>
                                </div>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-gray-500" /> Available for personal accounts</div>
                                    <div className="flex gap-2"><AlertCircle className="h-4 w-4 text-orange-500" /> Requires 2-factor authentication</div>
                                    <div className="flex gap-2"><AlertCircle className="h-4 w-4 text-orange-500" /> More prone to disconnects</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'google-app-pw-instructions' && (
                    <div className="space-y-6 max-w-xl mx-auto text-center">
                        <div className="space-y-2">
                            <div className="flex justify-center mb-4 scale-125">
                                <GoogleLogo />
                            </div>
                            <h1 className="text-xl font-semibold">Connect Your Google Account</h1>
                            <p className="text-gray-400">Gmail / G-Suite</p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-300">Enable 2-step verification & generate App password</p>

                            <div className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 cursor-pointer">
                                <Video className="h-4 w-4" />
                                <span className="text-sm underline">connect.google_connect.app_password.watch_video</span>
                            </div>

                            <div className="space-y-4 text-left bg-[#111] p-6 rounded-xl border border-[#222]">
                                <p className="text-gray-400">1. Go to your Google Account's <span className="text-blue-500 cursor-pointer hover:underline">Security Settings</span></p>
                                <p className="text-gray-400">2. Enable <span className="text-blue-500 font-medium">2-step verification</span></p>
                                <div className="space-y-1">
                                    <p className="text-gray-400">3. Create an <span className="text-blue-500 font-medium">App password</span></p>
                                    <p className="text-xs text-gray-500 ml-4">Select 'Other' for both App and Device</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-2">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                onClick={() => setStep('google-app-pw-form')}
                            >
                                Next &gt;
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'google-app-pw-form' && (
                    <div className="space-y-6 max-w-md mx-auto text-center">
                        <div className="space-y-2">
                            <div className="flex justify-center mb-4 scale-125">
                                <GoogleLogo />
                            </div>
                            <h1 className="text-xl font-semibold">Connect Your Google Account</h1>
                            <p className="text-gray-400">Gmail / G-Suite</p>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-400 font-medium ml-1">First Name</Label>
                                    <Input
                                        className="h-10 bg-[#111] border-[#333] text-white focus:border-blue-500"
                                        value={firstName} onChange={e => setFirstName(e.target.value)}
                                        placeholder="First Name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-400 font-medium ml-1">Last Name</Label>
                                    <Input
                                        className="h-10 bg-[#111] border-[#333] text-white focus:border-blue-500"
                                        value={lastName} onChange={e => setLastName(e.target.value)}
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-400 font-medium ml-1">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-10 bg-[#111] border-[#333] text-white focus:border-blue-500"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="Email address to connect"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-400 font-medium ml-1">App Password <span className="text-red-500">*</span></Label>
                                <Input
                                    type="password"
                                    className="h-10 bg-[#111] border-[#333] text-white focus:border-blue-500"
                                    value={appPassword} onChange={e => setAppPassword(e.target.value)}
                                    placeholder="App Password"
                                />
                                <p className="text-[10px] text-gray-500 px-1">Enter your 16 character app password <span className="text-blue-500 cursor-pointer hover:underline">without any spaces</span></p>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                className="bg-[#10b981] hover:bg-[#059669] text-white min-w-[140px]"
                                onClick={handleConnect}
                                disabled={isConnecting}
                            >
                                {isConnecting ? "Connecting..." : "Connect >"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
