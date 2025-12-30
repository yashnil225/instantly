"use client"

import { useEffect, useState } from "react"
import { ApiKeysSection } from "@/components/settings/ApiKeysSection"
import { WebhooksSection } from "@/components/settings/WebhooksSection"
import { Globe, ScrollText, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function IntegrationsPage() {
    const [activeSection, setActiveSection] = useState("integrations")

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace("#", "")
            if (hash) setActiveSection(hash)
        }

        window.addEventListener("hashchange", handleHashChange)
        handleHashChange()

        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [])

    return (
        <div className="space-y-12 pb-20 overflow-visible">
            {/* Integrations Section */}
            <section id="integrations" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-2">Integrations</h2>
                    <p className="text-sm text-gray-400">Connect Instantly with your favorite tools</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { name: 'Zapier', desc: 'Connect with 5000+ apps', icon: '⚡', status: 'Connected' },
                        { name: 'n8n', desc: 'Self-hosted workflow automation', icon: '🤖', status: 'Configure' },
                        { name: 'HubSpot', desc: 'Sync leads with your CRM', icon: '🧡', status: 'Configure' },
                        { name: 'Slack', desc: 'Get notifications in Slack', icon: '💬', status: 'Configure' },
                        { name: 'Pipedrive', desc: 'Manage your sales pipeline', icon: '📈', status: 'Configure' },
                        { name: 'Close', desc: 'All-in-one CRM for startups', icon: '🎯', status: 'Configure' }
                    ].map((item) => (
                        <div key={item.name} className="p-6 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg hover:border-[#333] transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-2xl">{item.icon}</div>
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                    item.status === 'Connected' ? "bg-green-500/10 text-green-500" : "bg-gray-800 text-gray-400"
                                )}>
                                    {item.status}
                                </span>
                            </div>
                            <h3 className="text-white font-medium mb-1 font-outfit">{item.name}</h3>
                            <p className="text-[12px] text-gray-500 line-clamp-2">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="h-[1px] bg-[#1a1a1a]" />

            {/* Webhooks Section */}
            <section id="webhooks" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-2 font-outfit">Webhooks</h2>
                    <p className="text-sm text-gray-400">Send real-time events to your own servers</p>
                </div>
                <WebhooksSection />
            </section>

            <div className="h-[1px] bg-[#1a1a1a]" />

            {/* API Keys Section */}
            <section id="keys" className="scroll-mt-6">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-1">API Keys</h2>
                    </div>
                </div>
                <ApiKeysSection />
            </section>
        </div>
    )
}
