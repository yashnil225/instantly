"use client"

// Sections
import { ProfileSection } from "@/components/app/settings/ProfileSection"
import { WorkspacesListSection } from "@/components/app/settings/WorkspacesListSection"
import WorkspaceGroupsPage from "@/app/settings/groups/page"
import LeadLabelsPage from "@/app/settings/labels/page"
import CustomTagsPage from "@/app/settings/tags/page"
import AgencyPage from "@/app/settings/agency/page"
import AuditLogsPage from "@/app/settings/logs/page"

// Icons for section headers (optional, matching sidebar)
import { User, Users, Building2, Tag, Shield, ScrollText } from "lucide-react"

interface SettingsOnePageProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
        plan?: string | null
        planExpiresAt?: Date | null
    }
    workspaceId: string | null
}

export function SettingsOnePageView({ user, workspaceId }: SettingsOnePageProps) {
    // We can use an IntersectionObserver here to update the sidebar active state if we were lifting state up.
    // However, the Sidebar is in the Layout. 
    // To update the sidebar from here, we might need a context or simple hash-based updates.
    // For now, let's just render the sections.

    return (
        <div className="space-y-20 pb-20 relative">

            {/* Profile Section */}
            <section id="profile" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" /> Profile
                    </h2>
                    <p className="text-muted-foreground text-sm">Manage your personal information and security settings.</p>
                </div>
                <ProfileSection user={user} />
            </section>

            <div className="h-[1px] bg-secondary" />

            {/* Workspace Section */}
            <section id="workspace" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" /> My Workspaces
                    </h2>
                    <p className="text-muted-foreground text-sm">Manage your workspaces and team members.</p>
                </div>
                <WorkspacesListSection />
            </section>

            <div className="h-[1px] bg-secondary" />

            {/* Groups Section */}
            <section id="groups" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" /> Workspace Group
                    </h2>
                </div>
                <WorkspaceGroupsPage />
            </section>

            <div className="h-[1px] bg-secondary" />

            {/* Labels Section */}
            <section id="labels" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-blue-500" /> Lead Labels
                    </h2>
                </div>
                <LeadLabelsPage />
            </section>

            <div className="h-[1px] bg-secondary" />

            {/* Tags Section */}
            <section id="tags" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-blue-500" /> Custom Tags
                    </h2>
                </div>
                <CustomTagsPage />
            </section>

            <div className="h-[1px] bg-secondary" />

            {/* Agency Section */}
            <section id="agency" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" /> Agency
                    </h2>
                </div>
                <AgencyPage />
            </section>

            <div className="h-[1px] bg-secondary" />


            <div className="h-[1px] bg-secondary" />

            {/* Logs Section */}
            <section id="logs" className="scroll-mt-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-blue-500" /> Audit Logs
                    </h2>
                </div>
                <AuditLogsPage />
            </section>

        </div>
    )
}
