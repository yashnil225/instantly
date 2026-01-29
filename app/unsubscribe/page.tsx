"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

function UnsubscribeContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")

    const handleUnsubscribe = async () => {
        try {
            const res = await fetch(`/api/unsubscribe?token=${token}`, {
                method: "POST"
            })

            const data = await res.json()

            if (res.ok) {
                setStatus("success")
                setMessage("You have been successfully unsubscribed from all future emails.")
            } else {
                setStatus("error")
                setMessage(data.error || "Failed to unsubscribe")
            }
        } catch (error) {
            setStatus("error")
            setMessage("An error occurred. Please try again.")
        }
    }

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("Invalid unsubscribe link")
            return
        }

        handleUnsubscribe()
    }, [token])

    return (
        <Card className="w-full max-w-md p-8 space-y-6 text-center">
            {status === "loading" && (
                <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <h1 className="text-2xl font-bold">Processing...</h1>
                    <p className="text-muted-foreground">Please wait while we unsubscribe you.</p>
                </>
            )}

            {status === "success" && (
                <>
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <h1 className="text-2xl font-bold">Unsubscribed Successfully</h1>
                    <p className="text-muted-foreground">{message}</p>
                    <p className="text-sm text-muted-foreground">
                        You will no longer receive emails from our campaigns.
                    </p>
                </>
            )}

            {status === "error" && (
                <>
                    <XCircle className="h-16 w-16 text-destructive mx-auto" />
                    <h1 className="text-2xl font-bold">Unsubscribe Failed</h1>
                    <p className="text-muted-foreground">{message}</p>
                    <Button onClick={handleUnsubscribe} variant="outline">
                        Try Again
                    </Button>
                </>
            )}
        </Card>
    )
}

export default function UnsubscribePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md p-8 space-y-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <h1 className="text-2xl font-bold">Loading...</h1>
                </Card>
            }>
                <UnsubscribeContent />
            </Suspense>
        </div>
    )
}

