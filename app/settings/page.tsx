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

    // Find the primary/first workspace for the user (owned or member)
    const firstWorkspace = await prisma.workspace.findFirst({
        where: {
            OR: [
                { userId: session.user.id },
                { members: { some: { userId: session.user.id } } }
            ]
        },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
        ]
    })

    return <SettingsOnePageView user={user} workspaceId={firstWorkspace?.id || null} />
}
