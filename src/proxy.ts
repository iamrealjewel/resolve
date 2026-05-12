import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccess } from "@/lib/rbac";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;
    const isLandingPage = pathname === "/";

    if (isLandingPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isAuth) {
      const role = token.role as string;
      if (!canAccess(role, pathname)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuth = !!token;
        const isPublic = ["/", "/login", "/forgot-password", "/reset-password", "/api/auth/forgot-password", "/api/auth/reset-password"].includes(req.nextUrl.pathname);
        
        if (isPublic) return true;
        
        return isAuth;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*", 
    "/users/:path*", 
    "/masters/:path*", 
    "/org/:path*", 
    "/incidents/:path*", 
    "/reports/:path*", 
    "/settings/:path*"
  ],
};
