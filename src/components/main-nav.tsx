import Link from "next/link"
import { useSession } from "next-auth/react"

import { cn } from "~/utils/helper"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { data: sessionData } = useSession()

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-8", className)}
      {...props}
    >
      <Link
        href="/admin/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Overview
      </Link>
      {sessionData?.user?.role === "ADMIN" ?
        <Link
          href="/admin/users"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Users
        </Link> : <></>
      }
      <Link
        href="/admin/projects"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Projects
      </Link>
      <Link
        href="/admin/documents"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Documents
      </Link>
    </nav>
  )
}
