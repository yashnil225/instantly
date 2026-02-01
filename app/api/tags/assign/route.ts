import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { entityId, entityType, tagId } = await req.json();

        if (!entityId || !entityType || !tagId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (entityType === 'campaign') {
            await prisma.campaignTag.create({
                data: {
                    campaignId: entityId,
                    tagId: tagId
                }
            });
        } else if (entityType === 'account') {
            await prisma.emailAccountTag.create({
                data: {
                    emailAccountId: entityId,
                    tagId: tagId
                }
            });
        } else if (entityType === 'lead') {
            await prisma.leadTag.create({
                data: {
                    leadId: entityId,
                    tagId: tagId
                }
            });
        } else {
            return new NextResponse("Invalid entity type", { status: 400 });
        }

        return new NextResponse("Assigned", { status: 200 });
    } catch (error) {
        // P2002 is Prisma unique constraint violation (already exists)
        if ((error as any).code === 'P2002') {
            return new NextResponse("Tag already assigned", { status: 200 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { entityId, entityType, tagId } = await req.json();

        if (!entityId || !entityType || !tagId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (entityType === 'campaign') {
            await prisma.campaignTag.deleteMany({
                where: {
                    campaignId: entityId,
                    tagId: tagId
                }
            });
        } else if (entityType === 'account') {
            await prisma.emailAccountTag.deleteMany({
                where: {
                    emailAccountId: entityId,
                    tagId: tagId
                }
            });
        } else if (entityType === 'lead') {
            await prisma.leadTag.deleteMany({
                where: {
                    leadId: entityId,
                    tagId: tagId
                }
            });
        } else {
            return new NextResponse("Invalid entity type", { status: 400 });
        }

        return new NextResponse("Removed", { status: 200 });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
