import { auth } from "@/auth"
import { SettingsSidebarController } from "@/components/settings/SettingsSidebarController"
import { SettingsTopNav } from "@/components/settings/SettingsTopNav"

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Top Navigation - Header */}
            <div className="border-b border-border px-8 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <div className="flex items-center gap-4">
                        <div className="bg-card px-3 py-1.5 rounded border border-border text-sm text-muted-foreground flex items-center gap-2 cursor-pointer">
                            My Organizatio...
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
                <SettingsTopNav />
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Conditional Sidebar */}
                <SettingsSidebarController />

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </div>
        </div>
    )
}
