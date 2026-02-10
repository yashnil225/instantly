// import { auth } from "@/auth"
import { SettingsSidebarController } from "@/components/app/settings/SettingsSidebarController"
import { SettingsTopNav } from "@/components/app/settings/SettingsTopNav"

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // const session = await auth()

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Top Navigation - Header */}
            <div className="border-b border-border px-8 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
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
