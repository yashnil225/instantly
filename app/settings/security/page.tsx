"use client"

import { useState, useEffect } from "react"
import {
    Shield,
    Smartphone,
    Key,
    AlertTriangle,
    CheckCircle,
    Copy,
    RefreshCw,
    X,
    Laptop,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export default function SecuritySettingsPage() {
    const { toast } = useToast()
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [setupModalOpen, setSetupModalOpen] = useState(false)
    const [disableModalOpen, setDisableModalOpen] = useState(false)
    const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false)

    // Setup flow state
    const [setupStep, setSetupStep] = useState(1)
    const [qrCode, setQrCode] = useState("")
    const [secret, setSecret] = useState("")
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [verificationCode, setVerificationCode] = useState("")
    const [loading, setLoading] = useState(false)

    // Trusted devices (demo data)
    const [trustedDevices] = useState([
        { id: "1", name: "Chrome on Windows", lastUsed: "Just now", current: true },
        { id: "2", name: "Safari on iPhone", lastUsed: "2 days ago", current: false },
    ])

    // Start 2FA setup
    const startSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                setQrCode(data.qrCodeDataUrl)
                setSecret(data.secret)
                setBackupCodes(data.backupCodes)
                setSetupStep(1)
                setSetupModalOpen(true)
            }
        } catch {
            toast({ title: "Error", description: "Failed to start 2FA setup", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Verify and enable 2FA
    const verifyAndEnable = async () => {
        if (verificationCode.length !== 6) {
            toast({ title: "Error", description: "Please enter a 6-digit code", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: verificationCode })
            })

            if (res.ok) {
                setTwoFactorEnabled(true)
                setSetupStep(3)
                toast({ title: "Success", description: "Two-factor authentication enabled!" })
            } else {
                toast({ title: "Error", description: "Invalid verification code", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Verification failed", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Disable 2FA
    const disable2FA = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/2fa/disable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: verificationCode })
            })

            if (res.ok) {
                setTwoFactorEnabled(false)
                setDisableModalOpen(false)
                setVerificationCode("")
                toast({ title: "Success", description: "Two-factor authentication disabled" })
            } else {
                toast({ title: "Error", description: "Invalid verification code", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to disable 2FA", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ title: "Copied!", description: "Copied to clipboard" })
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="h-6 w-6 text-blue-500" />
                        Security Settings
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your account security and authentication methods</p>
                </div>

                {/* Two-Factor Authentication */}
                <Card className="bg-[#111] border-[#2a2a2a] p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Add an extra layer of security to your account using an authenticator app
                                </p>
                                {twoFactorEnabled && (
                                    <Badge className="mt-2 bg-green-500/10 text-green-500">
                                        <CheckCircle className="h-3 w-3 mr-1" /> Enabled
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            {twoFactorEnabled ? (
                                <Button
                                    variant="outline"
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                    onClick={() => setDisableModalOpen(true)}
                                >
                                    Disable
                                </Button>
                            ) : (
                                <Button
                                    onClick={startSetup}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? "Loading..." : "Enable 2FA"}
                                </Button>
                            )}
                        </div>
                    </div>

                    {twoFactorEnabled && (
                        <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                            <Button
                                variant="outline"
                                className="border-[#2a2a2a] text-gray-400"
                                onClick={() => setBackupCodesModalOpen(true)}
                            >
                                <Key className="h-4 w-4 mr-2" />
                                View Backup Codes
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Trusted Devices */}
                <Card className="bg-[#111] border-[#2a2a2a] p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Laptop className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Trusted Devices</h2>
                            <p className="text-sm text-gray-400">Devices that can skip 2FA for 30 days</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {trustedDevices.map((device) => (
                            <div key={device.id} className="flex items-center justify-between py-3 border-b border-[#2a2a2a] last:border-0">
                                <div className="flex items-center gap-3">
                                    <Laptop className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-white font-medium">
                                            {device.name}
                                            {device.current && (
                                                <Badge className="ml-2 bg-blue-500/10 text-blue-500 text-xs">Current</Badge>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">Last used: {device.lastUsed}</p>
                                    </div>
                                </div>
                                {!device.current && (
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-[#111] border-[#2a2a2a] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Login Activity</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                            <span className="text-gray-400">Login from Chrome on Windows</span>
                            <span className="text-gray-500">Just now</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                            <span className="text-gray-400">Password changed</span>
                            <span className="text-gray-500">2 days ago</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Login from Safari on iPhone</span>
                            <span className="text-gray-500">3 days ago</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 2FA Setup Modal */}
            <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
                <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            {setupStep === 1 && "Scan QR Code"}
                            {setupStep === 2 && "Enter Verification Code"}
                            {setupStep === 3 && "Save Backup Codes"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {setupStep === 1 && "Scan this QR code with your authenticator app"}
                            {setupStep === 2 && "Enter the 6-digit code from your authenticator app"}
                            {setupStep === 3 && "Save these backup codes in a secure location"}
                        </DialogDescription>
                    </DialogHeader>

                    {setupStep === 1 && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-center bg-white rounded-lg p-4">
                                {qrCode ? (
                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-2">Or enter this code manually:</p>
                                <div className="flex items-center justify-center gap-2">
                                    <code className="bg-[#2a2a2a] px-3 py-1.5 rounded text-sm font-mono text-green-400">
                                        {secret || "XXXX XXXX XXXX XXXX"}
                                    </code>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secret)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {setupStep === 2 && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="text-gray-400">Verification Code</Label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                    className="mt-2 bg-[#1a1a1a] border-[#2a2a2a] text-white text-center text-2xl font-mono tracking-widest"
                                />
                            </div>
                        </div>
                    )}

                    {setupStep === 3 && (
                        <div className="space-y-4 py-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                    <p className="text-sm text-yellow-400">
                                        Save these codes somewhere safe. Each code can only be used once.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {backupCodes.map((code, i) => (
                                    <code key={i} className="bg-[#2a2a2a] px-3 py-2 rounded text-sm font-mono text-center">
                                        {code}
                                    </code>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-[#2a2a2a]"
                                onClick={() => copyToClipboard(backupCodes.join("\n"))}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy All Codes
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        {setupStep === 1 && (
                            <Button onClick={() => setSetupStep(2)} className="bg-blue-600 hover:bg-blue-700 w-full">
                                Continue
                            </Button>
                        )}
                        {setupStep === 2 && (
                            <Button
                                onClick={verifyAndEnable}
                                disabled={loading || verificationCode.length !== 6}
                                className="bg-blue-600 hover:bg-blue-700 w-full"
                            >
                                {loading ? "Verifying..." : "Verify & Enable"}
                            </Button>
                        )}
                        {setupStep === 3 && (
                            <Button onClick={() => setSetupModalOpen(false)} className="bg-green-600 hover:bg-green-700 w-full">
                                I've Saved My Codes
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disable 2FA Modal */}
            <Dialog open={disableModalOpen} onOpenChange={setDisableModalOpen}>
                <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            Disable Two-Factor Authentication
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter your current 2FA code to disable two-factor authentication
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label className="text-gray-400">Verification Code</Label>
                        <Input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                            className="mt-2 bg-[#1a1a1a] border-[#2a2a2a] text-white text-center text-2xl font-mono tracking-widest"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisableModalOpen(false)} className="border-[#2a2a2a]">
                            Cancel
                        </Button>
                        <Button
                            onClick={disable2FA}
                            disabled={loading || verificationCode.length !== 6}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? "Disabling..." : "Disable 2FA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Backup Codes Modal */}
            <Dialog open={backupCodesModalOpen} onOpenChange={setBackupCodesModalOpen}>
                <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-500" />
                            Backup Codes
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Use these codes to access your account if you lose your authenticator
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {(backupCodes.length > 0 ? backupCodes : ["XXXX-XXXX", "XXXX-XXXX", "XXXX-XXXX", "XXXX-XXXX"]).map((code, i) => (
                                <code key={i} className="bg-[#2a2a2a] px-3 py-2 rounded text-sm font-mono text-center">
                                    {code}
                                </code>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            {backupCodes.length} codes remaining
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="w-full border-[#2a2a2a]"
                            onClick={() => {
                                // Would regenerate codes via API
                                toast({ title: "Info", description: "Regenerating backup codes..." })
                            }}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate Codes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
