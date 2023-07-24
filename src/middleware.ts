import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    if (req.nextauth.token?.role !== "ADMIN" && req.nextUrl.pathname.startsWith("/admin/users")) {
      return NextResponse.rewrite(new URL("/admin", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = { matcher: ["/admin/:path*", "/editor/:path*", "/api/:path*"] }
