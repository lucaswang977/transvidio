import { MainNav } from "~/components/main-nav"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { useRouter } from "next/router"

type LayoutProps = {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter()
  return (
    <>
      <main className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Logo onClick={() => router.push("/")} />
            <MainNav />
            <UserNav />
          </div>
        </div>
        {children}
      </main>
    </>
  )
}

export default Layout 
