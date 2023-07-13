import { MainNav } from "~/components/main-nav"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { ModeToggle } from "~/components/mode-toggle"
import Link from "next/link";

type LayoutProps = {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-w-[360px] md:w-full">
      <header className="border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Link href="/admin"><Logo /></Link>
          <MainNav />
          <div className="flex space-x-2 items-center">
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

export default Layout 
