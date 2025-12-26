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
        <div className="flex flex-col h-screen bg-[#0a0a0a]">
            {/* Top Navigation Tabs - Looking at screenshot 1 */}
            <div className="border-b border-[#1a1a1a] px-8 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
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
