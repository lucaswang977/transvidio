import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"

import { cn } from "~/utils/helper"
import { Button } from "~/components/ui/button"
import { Menu, X } from "lucide-react"
import * as React from "react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { data: sessionData } = useSession()
  const router = useRouter()
  const { pathname } = router

  return (
    <nav
      className={cn("flex flex-col", className)}
      {...props}
    >
      {menuOpen ?
        <Button variant="ghost"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}><X /></Button>
        : <Button variant="ghost"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}><Menu /></Button>
      }
      <div
        onClick={() => setMenuOpen(false)}
        className={`${menuOpen ? "flex flex-col" : "hidden"} border rounded px-6 py-2 bg-white space-y-2 z-10 md:space-y-0 md:flex md:flex-row md:border-0 md:space-x-8`}>
        <Link
          href="/admin/"
          className={`text-sm ${pathname === "/admin" ? "font-bold" : "text-muted-foreground"} transition-colors hover:text-primary md:block`}
        >
          Overview
        </Link>
        {
          sessionData?.user?.role === "ADMIN" ?
            <Link
              href="/admin/users"
              className={`text-sm ${pathname === "/admin/users" ? "font-bold" : "text-muted-foreground"} transition-colors hover:text-primary md:block`}
            >
              Users
            </Link> : <></>
        }
        <Link
          href="/admin/projects"
          className={`text-sm ${pathname === "/admin/projects" ? "font-bold" : "text-muted-foreground"} transition-colors hover:text-primary md:block`}
        >
          Projects
        </Link>
        <Link
          href="/admin/documents"
          className={`text-sm ${pathname === "/admin/documents" ? "font-bold" : "text-muted-foreground"} transition-colors hover:text-primary md:block`}
        >
          Documents
        </Link>
      </div>
    </nav >
  )
}
