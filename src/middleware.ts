import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    console.log("middleware", req.nextauth.token)
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

export const config = { matcher: ["/admin/:path*"] }
