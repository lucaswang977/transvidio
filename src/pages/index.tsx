// TODO: 
// 1. User management & user role
// 2. File upload support
// 3. Document and project management
// 4. First time deploy
// 5. Video player & subtitle editor
// 6. File import & auto transcript/translate
// 7. Test & optimize
// 8. First version release

// FIX:
// 1. User should be unable to open signin page after logged in.
// 2. A notfication should be shown up after signing up with email.

// NOTE:
// 1. Use Metadata to replace the Head tag

import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router"
import { signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Mail } from "lucide-react"

const Home: NextPage = () => {
  const router = useRouter();
  const { data: sessionData, status: status } = useSession();
  console.log(sessionData, status)

  return (
    <>
      <Head>
        <title>Transvid.io</title>
        <meta name="description" content="Help your courses to go global." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Button variant="outline" onClick={() => {
          if (status === "authenticated") {
            signOut()
          } else {
            router.push("/signin")
          }
        }}
          disabled={status === "loading"}>
          <Mail className="mr-2 h-4 w-4" /> {status === "authenticated" ? "Logout" : "Login"}
        </Button>
        <Label>{status === "authenticated" ? sessionData.user.email : "not logged in"}</Label>
      </main>
    </>
  );
};

export default Home;
