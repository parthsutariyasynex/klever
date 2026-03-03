import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
    const isLoginRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";

    // Public routes that don't need authentication
    if (isAuthRoute || isLoginRoute || request.nextUrl.pathname === "/") {
        if (token && isLoginRoute) {
            // Redirect to dashboard if already logged in and trying to access login/register
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Dashboard and protected API routes
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/api/products") || request.nextUrl.pathname.startsWith("/api/upload-csv");

    if (isProtectedRoute) {
        if (!token) {
            // For API routes: return 401 JSON so fetch() can handle it
            if (isApiRoute) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            // For page routes: redirect to login
            return NextResponse.redirect(new URL("/login", request.url));
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/register",
        "/api/:path*",
    ],
};
