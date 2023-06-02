import { type NextPage } from "next"
import Head from "next/head";
import { useRouter } from "next/router"
import { Download } from "lucide-react"
import { Button } from "~/components/ui/button";
import { MainNav } from "~/components/main-nav"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"

const Dashboard: NextPage = () => {
  const router = useRouter()

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
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Dashboard
