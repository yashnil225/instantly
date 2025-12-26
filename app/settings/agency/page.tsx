"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Plus, ChevronDown, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface AgencyClient {
    id: string
    email: string
    permissions: string
    status: string
}

export default function AgencyPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [showGuide, setShowGuide] = useState(false)

    const [domain, setDomain] = useState("")
    const [clients, setClients] = useState<AgencyClient[]>([])
    const [newClientEmail, setNewClientEmail] = useState("")
    const [newClientPermissions, setNewClientPermissions] = useState("view")
    const [addingClient, setAddingClient] = useState(false)

    useEffect(() => {
        fetchWorkspaceAndSettings()
    }, [])

    const fetchWorkspaceAndSettings = async () => {
        try {
            // First get workspace
            const wsRes = await fetch('/api/workspaces')
            if (wsRes.ok) {
                const workspaces = await wsRes.json()
                if (workspaces.length > 0) {
                    const wsId = workspaces[0].id
                    setWorkspaceId(wsId)

                    // Fetch agency settings
                    const agencyRes = await fetch(`/api/agency?workspaceId=${wsId}`)
                    if (agencyRes.ok) {
                        const data = await agencyRes.json()
                        setDomain(data.settings?.customDomain || "")
                        setClients(data.clients || [])
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch agency settings", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveDomain = async () => {
        if (!workspaceId) return
        setSaving(true)
        try {
            const res = await fetch('/api/agency', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId, customDomain: domain })
            })
            if (res.ok) {
                toast({ title: "Saved", description: "Agency domain updated" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save domain", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleUpload = () => {
        toast({ title: "Pro Feature", description: "Logo upload requires Pro subscription" })
    }

    const handleAddClient = async () => {
        if (!workspaceId || !newClientEmail.trim()) return
        setAddingClient(true)
        try {
            const res = await fetch('/api/agency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    email: newClientEmail,
                    permissions: newClientPermissions
                })
            })
            if (res.ok) {
                const client = await res.json()
                setClients(prev => [client, ...prev])
                setNewClientEmail("")
                toast({ title: "Added", description: "Client account added" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to add client", variant: "destructive" })
        } finally {
            setAddingClient(false)
        }
    }

    const handleDeleteClient = async (clientId: string) => {
        try {
            const res = await fetch(`/api/agency?clientId=${clientId}`, { method: 'DELETE' })
            if (res.ok) {
                setClients(prev => prev.filter(c => c.id !== clientId))
                toast({ title: "Removed", description: "Client removed" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove client", variant: "destructive" })
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="max-w-4xl space-y-8">
            {/* Pro Badge */}
            <div className="flex items-center gap-2">
                <span className="bg-[#fbbf24] text-black text-xs px-2 py-1 rounded font-bold">Pro Feature</span>
                <span className="text-muted-foreground text-sm">Agency settings require a Pro subscription</span>
            </div>

            {/* Domain Section */}
            <div className="space-y-4 border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center gap-2 text-foreground font-medium mb-4">
                    <span className="text-muted-foreground"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></span>
                    Domain <span className="text-muted-foreground text-xs ml-1">ⓘ</span>
                </div>

                <div className="flex gap-4">
                    <Input
                        placeholder="agency.mywebsite.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="bg-card border-[#333] text-foreground flex-1"
                    />
                    <Button onClick={handleSaveDomain} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-foreground px-6">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                </div>

                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
                >
                    {showGuide ? "Hide" : "Show"} setup guide <ChevronDown className={`h-3 w-3 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
                </button>

                {showGuide && (
                    <div className="bg-card border border-[#333] rounded p-4 text-sm text-muted-foreground space-y-2">
                        <p>1. Add a CNAME record pointing to <code className="text-blue-400">app.instantly.ai</code></p>
                        <p>2. Enter your custom domain above and save</p>
                        <p>3. Wait up to 24 hours for DNS propagation</p>
                    </div>
                )}
            </div>

            {/* Logo Section */}
            <div className="space-y-4 border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center gap-2 text-foreground font-medium mb-2">
                    <span className="text-muted-foreground"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                    Logo
                </div>

                <p className="text-xs text-muted-foreground mb-4">Add a logo to your workspace</p>

                <Button onClick={handleUpload} variant="outline" className="bg-secondary border-[#333] text-foreground hover:text-foreground hover:bg-[#2a2a2a] gap-2">
                    <Upload className="h-4 w-4" /> Upload file
                </Button>
            </div>

            {/* Client Accounts Section */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground">Client Accounts</h3>

                <div className="space-y-4 border border-border rounded-lg p-6 bg-background">
                    <div className="flex items-center gap-2 text-foreground font-medium mb-4">
                        <span className="text-muted-foreground"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg></span>
                        Add New Client Account
                    </div>

                    <div className="grid grid-cols-[1fr,200px,auto] gap-4">
                        <Input
                            placeholder="Enter client email address"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            className="bg-card border-[#333] text-foreground"
                        />
                        <Select value={newClientPermissions} onValueChange={setNewClientPermissions}>
                            <SelectTrigger className="bg-card border-[#333] text-foreground">
                                <SelectValue placeholder="Select permissions" />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-[#333] text-foreground">
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="edit">Edit</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleAddClient}
                            disabled={addingClient || !newClientEmail.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-foreground min-w-[80px]"
                        >
                            {addingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                    </div>
                </div>

                {/* Client List */}
                {clients.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1fr,150px,100px] bg-card border-b border-border py-3 px-4">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">EMAIL</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">PERMISSIONS</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">ACTIONS</div>
                        </div>
                        <div className="divide-y divide-[#2a2a2a] bg-background">
                            {clients.map(client => (
                                <div key={client.id} className="grid grid-cols-[1fr,150px,100px] py-3 px-4 items-center hover:bg-card">
                                    <div className="text-sm text-foreground">{client.email}</div>
                                    <div className="text-sm text-muted-foreground capitalize">{client.permissions}</div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteClient(client.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
