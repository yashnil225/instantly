import { auth } from "@/auth"
import { ProfileSection } from "@/components/settings/ProfileSection"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    // Fetch user with plan info
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            planExpiresAt: true,
        }
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Profile</h2>
                <p className="text-gray-400 text-sm">Manage your personal information and security settings.</p>
            </div>

            <ProfileSection user={user} />
        </div>
    )
}

