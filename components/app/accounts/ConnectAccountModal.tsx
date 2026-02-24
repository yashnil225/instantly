"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react"

interface ConnectAccountModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAccountConnected: () => void
    workspaceId?: string | null // If set, the new account is auto-assigned to this workspace
}

export function ConnectAccountModal({ open, onOpenChange, onAccountConnected, workspaceId }: ConnectAccountModalProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Providers, 2: Choice, 3: OAuth Instructions, 4: App Password Form
    const [provider, setProvider] = useState<"google" | "outlook" | "custom" | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "", // App Password
        smtpHost: "smtp.gmail.com",
        smtpPort: "587",
        imapHost: "imap.gmail.com",
        imapPort: "993"
    })

    const handleConnect = async () => {
        setLoading(true)
        setError(null)

        try {
            // Construct payload based on provider
            const payload: any = {
                ...formData,
                provider,
                // Use defaults for Google/Outlook if not custom, or let user edit them in a real app
                // For now we just send what's in formData which defaults to Gmail settings
                smtpUser: formData.email,
                imapUser: formData.email,
                smtpPass: formData.password,
                imapPass: formData.password
            }

            // Auto-assign to the currently-selected workspace if provided
            if (workspaceId && workspaceId !== 'all') {
                payload.workspaceIds = [workspaceId]
            }

            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to connect account")
            }

            onAccountConnected()
            onOpenChange(false)
            setStep(1)
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                smtpHost: "smtp.gmail.com",
                smtpPort: "587",
                imapHost: "imap.gmail.com",
                imapPort: "993"
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-card border-border text-card-foreground">
                <DialogHeader>
                    {step > 1 && (
                        <div
                            className="absolute left-6 top-6 flex cursor-pointer items-center gap-1 text-sm text-gray-400 hover:text-white"
                            onClick={() => {
                                if (step === 2) setStep(1)
                                else if (step === 3) setStep(2)
                                else if (step === 4) setStep(2)
                            }}
                        >
                            &lt; Back
                        </div>
                    )}
                    {/* Spacer for custom back button */}
                    <div className="h-6"></div>
                </DialogHeader>

                {step === 1 ? (
                    <div className="space-y-6 py-4 px-4">
                        <div className="space-y-2 mb-6">
                            <DialogTitle className="text-xl font-semibold">Connect existing accounts</DialogTitle>
                            <DialogDescription>Select an email provider to connect.</DialogDescription>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-orange-200">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-gray-300">Connect any IMAP or SMTP email provider</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-200">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-gray-300">Sync up replies in the Unibox</span>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={() => { setProvider("google"); setStep(2) }}
                                className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4 transition-all hover:border-[#333] hover:bg-[#1a1a1a] text-left group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white font-bold group-hover:scale-105 transition-transform">
                                    <span className="text-blue-500 text-xl">G</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-200">Google</div>
                                    <div className="text-sm text-gray-500">Gmail / G-Suite</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setProvider("outlook"); setStep(4) }}
                                className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4 transition-all hover:border-[#333] hover:bg-[#1a1a1a] text-left group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white font-bold group-hover:scale-105 transition-transform">
                                    <span className="text-orange-500 text-xl">O</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-200">Microsoft</div>
                                    <div className="text-sm text-gray-500">Office 365 / Outlook</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setProvider("custom"); setStep(4) }}
                                className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4 transition-all hover:border-[#333] hover:bg-[#1a1a1a] text-left group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-gray-400 group-hover:scale-105 transition-transform">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-200">Any Provider</div>
                                    <div className="text-sm text-gray-500">IMAP / SMTP</div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : step === 2 ? (
                    <div className="py-2 px-4">
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
                                <span className="text-2xl font-bold text-blue-500">G</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white">Connect Your Google Account</h3>
                            <p className="text-sm text-gray-500">Gmail / G-Suite</p>
                        </div>

                        <div className="text-center mb-4 text-sm font-medium text-blue-400">Select a connection option</div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Option 1: OAuth */}
                            <div
                                onClick={() => setStep(3)}
                                className="cursor-pointer rounded-xl border border-blue-600 bg-blue-600/10 p-6 transition-all hover:bg-blue-600/20 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-bold text-white">Option 1: OAuth</h4>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-sm text-gray-200">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600"><Check className="h-3 w-3" /></div>
                                        Easier to setup
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-200">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600"><Check className="h-3 w-3" /></div>
                                        More stable and less disconnects
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-200">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600"><Check className="h-3 w-3" /></div>
                                        Available for GSuite accounts
                                    </li>
                                </ul>
                                <div className="flex justify-center">
                                    <span className="rounded-full bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-400 ring-1 ring-green-900 border border-green-800">Recommended</span>
                                </div>
                            </div>

                            {/* Option 2: App Password */}
                            <div
                                onClick={() => setStep(4)}
                                className="cursor-pointer rounded-xl border border-[#333] bg-[#111] p-6 transition-all hover:border-[#444] hover:bg-[#161616]"
                            >
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-bold text-blue-400">Option 2: App Password</h4>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-sm text-gray-400">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#333] text-gray-400"><Check className="h-3 w-3" /></div>
                                        Available for personal accounts
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-orange-400">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-500/30 text-orange-500"><AlertCircle className="h-3 w-3" /></div>
                                        Requires 2-factor authentication
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-orange-400">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-500/30 text-orange-500"><AlertCircle className="h-3 w-3" /></div>
                                        More prone to disconnects
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : step === 3 ? (
                    <div className="space-y-6 py-4 px-4">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
                                <span className="text-2xl font-bold text-blue-500">G</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white">Connect Your Google Account</h3>
                            <p className="text-sm text-gray-500">Gmail / G-Suite</p>
                        </div>

                        <div className="rounded-lg bg-[#111] p-4 text-center">
                            <p className="text-sm text-gray-300">Allow Instantly to access your Google workspace</p>
                            <div className="mt-2 text-xs font-medium text-green-500 px-2 py-1 bg-green-950/30 rounded inline-block">
                                You only need to do this once per domain
                            </div>
                            <div className="mt-4 flex justify-center">
                                <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                                    <span>🎥</span> Watch tutorial video
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 font-bold text-white">1.</span>
                                <div>Go to your <a href="#" className="text-blue-400 hover:underline">Google Workspace Admin Panel</a></div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 font-bold text-white">2.</span>
                                <div>Click &quot;Configure new app&quot;</div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 font-bold text-white">3.</span>
                                <div className="w-full space-y-2">
                                    <div>Use the following Client-ID to search for Instantly:</div>
                                    <div className="flex items-center gap-2 rounded bg-[#1a1a1a] p-2 font-mono text-xs text-gray-300">
                                        <span className="truncate">536726988839-pt93oro4685dtb1emb0pp2vjgjol5mls.apps.googleusercontent.com</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-12 text-xs">Copy</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 font-bold text-white">4.</span>
                                <div>Select and approve Instantly to access your Google Workspace</div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={async () => {
                                    setLoading(true)
                                    try {
                                        const callbackUrl = window.location.pathname + window.location.search
                                        const res = await fetch(`/api/auth/google/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`)
                                        const data = await res.json()
                                        if (data.url) {
                                            window.location.href = data.url
                                        } else {
                                            throw new Error("Failed")
                                        }
                                    } catch {
                                        setError("Failed to start OAuth")
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Login &gt;
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Step 4: App Password Form
                    <div className="space-y-4 py-4 px-4">
                        <div className="mb-6">
                            <DialogTitle className="text-xl font-semibold">Connect Account</DialogTitle>
                            <DialogDescription>Enter your account details manually.</DialogDescription>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>App Password / Password</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="App Password (Recommended)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use an App Password if 2FA is enabled.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button onClick={handleConnect} disabled={loading} className="bg-primary text-primary-foreground">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
