import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const tags = await prisma.tag.findMany({
            where: { userId: session.user.id },
            orderBy: { name: "asc" }
        });
        return NextResponse.json(tags);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { name, color } = body;

        if (!name) return new NextResponse("Name is required", { status: 400 });

        const tag = await prisma.tag.create({
            data: {
                name,
                color: color || "#3b82f6",
                userId: session.user.id
            }
        });

        return NextResponse.json(tag);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new NextResponse("ID is required", { status: 400 });

        await prisma.tag.deleteMany({
            where: {
                id,
                userId: session.user.id // Security check
            }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
