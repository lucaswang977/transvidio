import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

import { cn } from "~/utils/helper"
import { Button } from "~/components/ui/button"
import { Menu, X } from "lucide-react"
import * as React from "react"

const navLinks = [
  {
    title: "Overview",
    href: "/admin",
    adminOnly: false
  },
  {
    title: "Users",
    href: "/admin/users",
    adminOnly: true
  },
  {
    title: "Projects",
    href: "/admin/projects",
    adminOnly: false
  },
  {
    title: "Documents",
    href: "/admin/documents",
    adminOnly: false
  },
  {
    title: "Payouts",
    href: "/admin/payouts",
    adminOnly: false
  },
]

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { data: sessionData } = useSession()
  const pathname = usePathname()

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
        className={`${menuOpen ? "flex flex-col" : "hidden"} border rounded px-6 py-2 bg-white dark:bg-black space-y-2 z-10 md:space-y-0 md:flex md:flex-row md:border-0 md:space-x-8`}>
        {navLinks.map((item) => {
          const result = (<Link key={item.href} href={item.href} className={`text-sm ${pathname === item.href ? "font-bold" : "text-muted-foreground"} transition-colors hover:text-primary md:block`} > {item.title} </Link>)
          if (!item.adminOnly || sessionData?.user?.role === "ADMIN") return result
        })}
      </div>
    </nav >
  )
}
