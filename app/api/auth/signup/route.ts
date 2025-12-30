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

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and default workspace in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
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
