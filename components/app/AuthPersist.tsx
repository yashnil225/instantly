"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export default function AuthPersist() {
    const { data: session } = useSession()

    useEffect(() => {
        if (session?.user) {
            localStorage.setItem("instantly_user", JSON.stringify(session.user))
        }
    }, [session])

    return null
}
