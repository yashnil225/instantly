"use client"
import { useEffect } from 'react'

export default function ClosePopup() {
    useEffect(() => {
        window.close()
    }, [])

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#191a1b]">
            <p className="text-gray-500">Completing sign in...</p>
        </div>
    )
}
