import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/signup")

    if (!isLoggedIn && !isAuthPage) {
        // Store the current URL so we can redirect back after login
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
        return NextResponse.redirect(new URL(`/signup?callbackUrl=${callbackUrl}`, req.url))
    }

    if (isLoggedIn && isAuthPage) {
        // Redirect to callbackUrl if provided, otherwise to root (which can redirect to default page)
        const callbackUrl = req.nextUrl.searchParams.get("callbackUrl")
        const redirectTo = callbackUrl ? decodeURIComponent(callbackUrl) : "/"
        return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
