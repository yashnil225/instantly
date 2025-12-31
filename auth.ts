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
    debug: process.env.NODE_ENV === 'development' || true, // Force debug for now to help user
    pages: {
        signIn: '/login',
        newUser: '/signup',
    },
    providers,
    callbacks: {
        async signIn({ user, account, profile }) {
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
