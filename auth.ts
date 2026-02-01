import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

const providers: any[] = [
    CredentialsProvider({
        name: "credentials",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                return null
            }

            const user = await prisma.user.findUnique({
                where: { email: credentials.email as string }
            })

            if (!user || !user.password) {
                return null
            }

            const passwordMatch = await bcrypt.compare(
                credentials.password as string,
                user.password
            )

            if (!passwordMatch) {
                return null
            }

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
            }
        }
    })
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
        authorization: {
            params: {
                scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
                prompt: "consent",
                access_type: "offline",
                response_type: "code"
            }
        }
    }))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET || "secret",
    providers,
    events: {
        async createUser({ user }) {
            // Automatically create default workspace for any new user (Google or Credentials)
            if (user.id) {
                try {
                    await prisma.workspace.create({
                        data: {
                            name: "My Organization",
                            userId: user.id,
                            isDefault: true,
                            opportunityValue: 5000,
                            members: {
                                create: {
                                    userId: user.id,
                                    role: "owner"
                                }
                            }
                        }
                    })
                    console.log(`[NextAuth] Created default workspace for user ${user.id}`)
                } catch (error) {
                    console.error(`[NextAuth] Failed to create workspace for new user ${user.id}:`, error)
                }
            }
        }
    }
})
