import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsOnePageView } from "@/components/app/settings/SettingsOnePageView"
import { prisma } from "@/lib/prisma"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    // Fetch fresh user data to ensure plan is up to date
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            plan: true,
            planExpiresAt: true
        }
    })

    if (!user) return redirect("/login")

    // Attempt to find the first workspace for the user (similar to WorkspacePage logic)
    const firstWorkspace = await prisma.workspace.findFirst({
        where: {
            members: {
                some: { userId: session.user.id }
            }
        }
    })

    return <SettingsOnePageView user={user} workspaceId={firstWorkspace?.id || null} />
}
