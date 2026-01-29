"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Crown, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProfileSectionProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        plan?: string | null
        planExpiresAt?: Date | null
    }
}

export function ProfileSection({ user }: ProfileSectionProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        password: ''
    })

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    password: formData.password
                })
            })

            if (!res.ok) throw new Error('Failed to update profile')

            setFormData(prev => ({ ...prev, password: '' }))
            toast({ title: "Success", description: "Profile updated successfully" })
            router.refresh()
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const getPlanInfo = (plan?: string | null) => {
        switch (plan?.toLowerCase()) {
            case 'growth':
                return { label: 'Growth', color: 'bg-blue-600', icon: Zap }
            case 'hypergrowth':
                return { label: 'Hypergrowth', color: 'bg-purple-600', icon: Zap }
            case 'lightspeed':
                return { label: 'Light Speed', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: Crown }
            case 'trial':
            default:
                return { label: 'Trial', color: 'bg-gray-600', icon: Zap }
        }
    }

    const planInfo = getPlanInfo(user.plan)
    const PlanIcon = planInfo.icon

    return (
        <div className="max-w-2xl space-y-8">
            {/* Current Plan Section */}
            <div className="space-y-4 bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${planInfo.color}`}>
                            <PlanIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">Current Plan:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${planInfo.color}`}>
                                    {planInfo.label}
                                </span>
                            </div>
                            {user.planExpiresAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Expires: {new Date(user.planExpiresAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    <Link href="/settings/billing">
                        <Button variant="outline" size="sm" className="border-blue-600 text-blue-500 hover:bg-blue-600/10">
                            {user.plan === 'trial' ? 'Upgrade Plan' : 'Manage Plan'}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-medium">
                    <span className="p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                    Name
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold">First</label>
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="bg-[#111] border-[#333] text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Last</label>
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="bg-[#111] border-[#333] text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-medium">
                    <span className="p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></span>
                    Email
                </div>
                <Input
                    value={formData.email}
                    disabled
                    className="bg-[#111] border-[#333] text-gray-400 cursor-not-allowed"
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-2 text-white font-medium">
                    <span className="p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                    Password
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="link"
                        className="text-blue-500 p-0 h-auto"
                        onClick={() => document.getElementById('password-input')?.focus()}
                    >
                        Set Password
                    </Button>
                </div>
                <Input
                    id="password-input"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-[#111] border-[#333] text-white"
                    placeholder="Enter new password"
                />
            </div>

            <div className="pt-6">
                <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white min-w-[100px]"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
            </div>
        </div>
    )
}

