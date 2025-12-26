"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LanguagePage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect back to previous page for coming soon features
        router.back()
    }, [router])

    return null
}
