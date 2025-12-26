"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Mail, AlertCircle, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectAccountModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAccountConnected: () => void
}

export function ConnectAccountModal({ open, onOpenChange, onAccountConnected }: ConnectAccountModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
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
            const payload = {
                ...formData,
                provider,
                // Use defaults for Google/Outlook if not custom, or let user edit them in a real app
                // For now we just send what's in formData which defaults to Gmail settings
                smtpUser: formData.email,
                imapUser: formData.email,
                smtpPass: formData.password,
                imapPass: formData.password
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

            <DialogContent className="sm:max-w-[600px] bg-card border-border text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {step === 1 ? "Connect existing accounts" : "Connect Account"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 ? "Select an email provider to connect." : "Enter your account details."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <div className="space-y-6 py-4">
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
                                onClick={() => { setProvider("outlook"); setStep(2) }}
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
                                onClick={() => { setProvider("custom"); setStep(2) }}
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
                ) : (
                    <div className="space-y-4 py-4">
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
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
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
