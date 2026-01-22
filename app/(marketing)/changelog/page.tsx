import { CheckCircle2 } from "lucide-react"

const updates = [
    {
        version: "v2.4.0",
        date: "May 15, 2024",
        title: "Advanced CRM Sync & Real-time Dashboards",
        changes: [
            "Enhanced Hubspot and Salesforce two-way synchronization",
            "Brand new real-time analytics dashboard with custom widgets",
            "Improved tracking pixel reliability for dark mode email clients",
            "New API endpoints for bulk tracking data export"
        ]
    },
    {
        version: "v2.3.5",
        date: "April 28, 2024",
        title: "Mobile App Performance & Security Updates",
        changes: [
            "Significant performance boost for the iOS and Android applications",
            "Multi-factor authentication (MFA) now available for all plans",
            "Optimized image loading for tracking reports",
            "Fixed a bug where some notifications were delayed"
        ]
    },
    {
        version: "v2.3.0",
        date: "April 10, 2024",
        title: "Team Workspaces & Role-based Access",
        changes: [
            "New workspace switcher for agencies managing multiple clients",
            "Custom roles and permissions (Admin, Editor, Viewer)",
            "Shared templates and tracking configurations",
            "Audit logs for all account activities"
        ]
    }
]

export default function ChangelogPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-muted/30 border-b border-border">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Changelog</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Stay up to date with the latest features, improvements, and fixes we&apos;ve shipped to make Instantly better for you.
                    </p>
                </div>
            </section>

            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-16">
                        {updates.map((update, i) => (
                            <div key={i} className="relative pl-8 border-l border-border pb-16 last:pb-0">
                                <div className="absolute left-[-5px] top-0 w-[10px] h-[10px] rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{update.version}</span>
                                        <span className="text-sm text-muted-foreground">{update.date}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{update.title}</h2>
                                    <ul className="space-y-4">
                                        {update.changes.map((change, j) => (
                                            <li key={j} className="flex gap-3 text-muted-foreground">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 sm:px-6 lg:px-8 py-20 bg-indigo-600 text-white text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Want to influence our roadmap?</h2>
                    <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
                        We build Instantly based on your feedback. Join our community forum to suggest features and vote on what we build next.
                    </p>
                    <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-full font-bold transition-all">
                        Join Community
                    </button>
                </div>
            </section>
        </div>
    )
}
