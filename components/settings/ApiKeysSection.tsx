"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Key, Trash2, Copy, Check, Eye, EyeOff, Plus, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKey {
    id: string
    name: string
    key: string
    scopes: string
    lastUsedAt: string | null
    createdAt: string
}

// No scopes needed as per user request

export function ApiKeysSection() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const fetchKeys = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/user/keys')
            if (!res.ok) throw new Error('Failed to fetch keys')
            const data = await res.json()
            setKeys(data.keys)
        } catch (error) {
            toast({ title: "Error", description: "Failed to load API keys", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchKeys()
    }, [])

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return
        setIsCreating(true)
        try {
            const res = await fetch('/api/user/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newKeyName,
                    scopes: ["all:all"]
                })
            })

            if (!res.ok) throw new Error('Failed to create key')

            const data = await res.json()
            setGeneratedKey(data.apiKey)
            setKeys([data.apiKey, ...keys])
            setIsCreateModalOpen(false)
            setIsSuccessModalOpen(true)
            setNewKeyName("")
        } catch (error) {
            toast({ title: "Error", description: "Failed to create API key", variant: "destructive" })
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteKey = async () => {
        if (!keyToDelete) return
        try {
            const res = await fetch('/api/user/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: keyToDelete })
            })

            if (!res.ok) throw new Error('Failed to delete key')

            setKeys(keys.filter(k => k.id !== keyToDelete))
            toast({ title: "Success", description: "API key deleted" })
            setIsDeleteModalOpen(false)
            setKeyToDelete(null)
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete API key", variant: "destructive" })
        }
    }

    // Scopes removed

    const [versionTab, setVersionTab] = useState("v2")

    return (
        <div className="space-y-6">
            {/* Version Tabs */}
            <div className="flex items-center gap-6 border-b border-[#1a1a1a]">
                <button
                    onClick={() => setVersionTab("v2")}
                    className={cn(
                        "pb-4 text-sm font-medium transition-all relative",
                        versionTab === "v2" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Version 2
                    {versionTab === "v2" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
                <button
                    onClick={() => setVersionTab("v1")}
                    className={cn(
                        "pb-4 text-sm font-medium transition-all relative flex items-center gap-2",
                        versionTab === "v1" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Version 1
                    <span className="text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded text-gray-500 font-normal">DEPRECATED</span>
                    {versionTab === "v1" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
            </div>

            {versionTab === "v1" ? (
                <div className="bg-[#0c0c0c] border border-yellow-900/20 rounded-lg p-10 text-center space-y-4">
                    <div className="flex justify-center">
                        <AlertCircle className="h-10 w-10 text-yellow-600/50" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-white font-medium">Legacy API V1</p>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            V1 is being deprecated and is no longer recommended for new integrations.
                            Please migrate to V2 for better performance and new features.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Button variant="outline" className="border-[#333] hover:bg-[#111] text-white">
                            View Documentation
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    {/* Header with Create Button */}
                    <div className="flex justify-end mb-6 absolute -top-16 right-0">
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-transparent border border-[#333] hover:bg-[#111] text-white flex items-center gap-2 px-4 py-2 text-sm"
                        >
                            <Key className="h-4 w-4" /> Create API Key
                        </Button>
                    </div>

                    {/* Empty State or List */}
                    {keys.length === 0 && !isLoading ? (
                        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-20 text-center space-y-4">
                            <div className="flex justify-center">
                                <Key className="h-10 w-10 text-gray-700" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-white font-medium">No API keys yet</p>
                                <p className="text-gray-500 text-sm">Create your first API key to start automating your workflow.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {keys.map((key) => (
                                <div key={key.id} className="p-6 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg group hover:border-[#333] transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-white font-medium font-outfit">{key.name}</h3>
                                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-mono font-bold">V2</span>
                                            </div>
                                            <p className="text-[12px] text-gray-500 uppercase tracking-wider">
                                                Last used {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 text-[12px]">
                                            <span className="text-gray-500">
                                                Created {new Date(key.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setKeyToDelete(key.id)
                                                    setIsDeleteModalOpen(true)
                                                }}
                                                className="text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl w-full max-w-xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Create API Key</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Name</label>
                                <Input
                                    placeholder="Name"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="bg-transparent border-[#333] text-white h-12 focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 text-white hover:bg-[#1a1a1a] h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateKey}
                                disabled={isCreating || !newKeyName.trim()}
                                className="flex-1 bg-[#1e40af] hover:bg-blue-600 text-white h-12"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {isSuccessModalOpen && generatedKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl w-full max-w-lg p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-[#222] pb-4 -mx-8 px-8">
                            <h2 className="text-lg font-semibold text-white">API Key Created Successfully</h2>
                            <button onClick={() => setIsSuccessModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Here is your new API key. Please copy it and store it securely.<br />
                                For security reasons, you will not be able to see it again.
                            </p>

                            <div className="bg-[#000] border border-[#222] p-4 rounded-lg flex items-center justify-between group mt-6 h-16">
                                <code className="text-blue-400 text-[13px] break-all flex-1 pr-4 font-mono">
                                    {generatedKey.key}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedKey.key)
                                        toast({ description: "Copied to clipboard" })
                                    }}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full bg-[#1e40af] hover:bg-blue-600 text-white mt-4 h-12"
                        >
                            Ok
                        </Button>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl w-full max-w-sm p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Are you sure?</h2>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed">
                            This will permanently delete this API key. Are you sure?
                        </p>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 text-white hover:bg-[#1a1a1a] h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteKey}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
