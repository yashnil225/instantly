import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and default workspace in a transaction, and process any pending invitations
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    password: hashedPassword,
                }
            })

            const workspace = await tx.workspace.create({
                data: {
                    name: "My Organization",
                    userId: newUser.id,
                    isDefault: true,
                    opportunityValue: 5000,
                    members: {
                        create: {
                            userId: newUser.id,
                            role: "owner"
                        }
                    }
                }
            })

            // Find all pending invitations for this email
            const pendingInvitations = await tx.invitation.findMany({
                where: {
                    email: normalizedEmail,
                    status: "pending",
                    expiresAt: { gt: new Date() }
                }
            })

            // Add user as member to all workspaces they were invited to
            for (const invite of pendingInvitations) {
                const existingMember = await tx.workspaceMember.findUnique({
                    where: {
                        workspaceId_userId: {
                            workspaceId: invite.workspaceId,
                            userId: newUser.id
                        }
                    }
                })

                if (!existingMember) {
                    await tx.workspaceMember.create({
                        data: {
                            workspaceId: invite.workspaceId,
                            userId: newUser.id,
                            role: invite.role || "member"
                        }
                    })
                }

                // Mark invitation as accepted
                await tx.invitation.update({
                    where: { id: invite.id },
                    data: { status: "accepted" }
                })
            }

            return { user: newUser, workspace }
        })

        return NextResponse.json(
            { message: "User created successfully", userId: result.user.id },
            { status: 201 }
        )
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        )
    }
}
