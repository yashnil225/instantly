import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsOnePageView } from "@/components/app/settings/SettingsOnePageView"
import { prisma } from "@/lib/prisma"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    // Fetch user with preferences if needed, or just pass session user
    // We also need to fetch the active workspace ID if we want to server render it
    // But for now, we'll let the component handle client-side workspace fetching or pass null

    // Attempt to find the first workspace for the user (similar to WorkspacePage logic)
    const firstWorkspace = await prisma.workspace.findFirst({
        where: {
            members: {
                some: { userId: session.user.id }
            }
        }
    })

    return <SettingsOnePageView user={session.user} workspaceId={firstWorkspace?.id || null} />
}
