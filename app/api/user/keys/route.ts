import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateKey } from "@/lib/api-auth"

/**
 * List API Keys
 */
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            key: true,
            scopes: true,
            lastUsedAt: true,
            createdAt: true,
        }
    })

    return NextResponse.json({ keys })
}

/**
 * Create API Key
 */
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { name, scopes } = await req.json()
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const key = generateKey()

        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key,
                scopes: scopes ? (Array.isArray(scopes) ? scopes.join(',') : scopes) : "all:all",
                userId: session.user.id,
            }
        })

        return NextResponse.json({ apiKey })
    } catch (error) {
        console.error("Failed to create API key:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * Delete (Revoke) API Key
 */
export async function DELETE(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await req.json()
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        await prisma.apiKey.delete({
            where: {
                id,
                userId: session.user.id // Ensure user owns the key
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete API key:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
