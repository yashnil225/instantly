import { auth } from "@/auth"
import { ProfileSection } from "@/components/settings/ProfileSection"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Profile</h2>
                <p className="text-gray-400 text-sm">Manage your personal information and security settings.</p>
            </div>

            <ProfileSection user={session.user} />
        </div>
    )
}
