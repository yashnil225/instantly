import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/signup")
    const isPublicPage = req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/terms") ||
        req.nextUrl.pathname.startsWith("/privacy") ||
        req.nextUrl.pathname.startsWith("/unsubscribe")

    if (!isLoggedIn && !isAuthPage && !isPublicPage) {
        // Store the current URL so we can redirect back after login
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
        // Redirect to /login instead of /signup to avoid loops and confusion
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
    }

    if (isLoggedIn && isAuthPage) {
        // Redirect to callbackUrl if provided, otherwise to /campaigns
        const callbackUrl = req.nextUrl.searchParams.get("callbackUrl")
        const redirectTo = callbackUrl ? decodeURIComponent(callbackUrl) : "/campaigns"
        return Response.redirect(new URL(redirectTo, req.url))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
