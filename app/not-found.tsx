"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NotFound() {
    const router = useRouter()

    useEffect(() => {
        // Redirect back to previous page when landing on a non-existent page
        router.back()
    }, [router])

    return null
}
