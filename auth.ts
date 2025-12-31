import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

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
            }
        }
    })
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET || "secret",
    pages: {
        signIn: '/login',
        newUser: '/signup',
    },
    providers,
    callbacks: {
        async signIn({ user, account, profile }) {
            // For Google OAuth: check if user exists, if not redirect to signup
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })

                if (!existingUser) {
                    // No account exists - redirect to signup with message
                    return `/signup?error=no_account&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`
                }

                // User exists - check if Google account is already linked
                // Use a separate query since include may not work with all adapters
                const linkedAccount = await (prisma as any).account?.findFirst?.({
                    where: {
                        userId: existingUser.id,
                        provider: account.provider,
                        providerAccountId: account.providerAccountId
                    }
                })

                if (!linkedAccount) {
                    // Link the OAuth account to the existing user
                    try {
                        await (prisma as any).account?.create?.({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                refresh_token: account.refresh_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                            }
                        })
                    } catch (e) {
                        // Account might already exist from adapter, continue
                        console.log('Account link attempted:', e)
                    }
                }
                // Update the user object to use the existing user's ID
                user.id = existingUser.id
            }
            return true
        },
        async jwt({ token, user, account, trigger }) {
            if (user) {
                token.id = user.id
            }
            if (account) {
                token.accessToken = account.access_token
            }
            // Check if this is a new session (first login indicator)
            if (trigger === 'signIn') {
                token.isNewLogin = true
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                    // Pass access token to client for Google Picker
                    ; (session as any).accessToken = token.accessToken
                    ; (session as any).isNewLogin = token.isNewLogin || false
            }
            // Clear the flag after first session
            token.isNewLogin = false
            return session
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith(baseUrl)) return url
            return `${baseUrl}/campaigns`
        }
    }
})
