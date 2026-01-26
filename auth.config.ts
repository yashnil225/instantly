import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
        newUser: '/signup',
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user
            const nextUrl = request.nextUrl
            const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                nextUrl.pathname.startsWith("/signup")
            const isPublicPage = nextUrl.pathname === "/" ||
                nextUrl.pathname.startsWith("/terms") ||
                nextUrl.pathname.startsWith("/privacy") ||
                nextUrl.pathname.startsWith("/unsubscribe")

            if (!isLoggedIn && !isAuthPage && !isPublicPage) {
                return false
            }

            if (isLoggedIn && isAuthPage) {
                const callbackUrl = nextUrl.searchParams.get("callbackUrl")
                const redirectTo = callbackUrl ? decodeURIComponent(callbackUrl) : "/campaigns"
                // Returning a URL to redirect
                return Response.redirect(new URL(redirectTo, nextUrl))
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
            return session
        },
        async redirect({ url, baseUrl }) {
            // Respect callback URLs or default to /campaigns
            if (url.startsWith(baseUrl)) return url
            if (url.startsWith("/")) return `${baseUrl}${url}`
            return `${baseUrl}/campaigns`
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
