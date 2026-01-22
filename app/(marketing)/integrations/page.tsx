import { CTASection } from "@/components/website/CTASection"
import { Shield, Zap, Lock, Globe, Mail, MessageSquare, Database, Calendar, ArrowRight } from "lucide-react"

const integrations = [
    { name: "Gmail", icon: Mail, desc: "Seamless integration with Google Workspace and personal Gmail accounts.", color: "text-red-500", bg: "bg-red-500/10" },
    { name: "Outlook", icon: Globe, desc: "Full support for Microsoft 365 and Outlook.com email services.", color: "text-blue-600", bg: "bg-blue-600/10" },
    { name: "Slack", icon: MessageSquare, desc: "Get real-time tracking notifications directly in your team channels.", color: "text-purple-600", bg: "bg-purple-600/10" },
    { name: "HubSpot", icon: Database, desc: "Automatically sync email engagement data with your HubSpot CRM.", color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Salesforce", icon: Shield, desc: "Enterprise-grade integration for high-volume sales teams using Salesforce.", color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Zapier", icon: Zap, desc: "Connect Instantly to 5,000+ apps and automate your entire workflow.", color: "text-orange-600", bg: "bg-orange-600/10" }
]

export default function IntegrationsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Powerful Integrations</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Instantly works with the tools you already use. Connect your workflow and supercharge your email engagement.
                    </p>
                </div>
            </section>

            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {integrations.map((item, i) => (
                            <div key={i} className="p-8 bg-card border border-border rounded-2xl hover:shadow-lg transition-all group">
                                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.name}</h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed">
                                    {item.desc}
                                </p>
                                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                                    Learn more <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CTASection
                title="Don't see your favorite tool?"
                description="We&apos;re constantly adding new integrations. Check our API documentation or request a custom integration for your enterprise needs."
                buttonText="View API Docs"
            />
        </div>
    )
}
