import Head from "next/head"

import { MainNav } from "~/components/main-nav"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"

type LayoutProps = {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {

  return (
    <>
      <Head>
        <title>Dashboard - Transvid.io</title>
        <meta name="description" content="Help your courses to go global." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Logo />
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
