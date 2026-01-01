import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const { name, color } = await req.json()
        // id already awaited

        const updated = await prisma.tag.updateMany({
            where: {
                id,
                userId: auth.user.id
            },
            data: {
                ...(name && { name }),
                ...(color && { color })
            }
        })

        if (updated.count === 0) {
            return NextResponse.json({ error: "Tag not found or unauthorized" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        // id already awaited
        await prisma.tag.delete({
            where: {
                id,
                userId: auth.user.id
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
