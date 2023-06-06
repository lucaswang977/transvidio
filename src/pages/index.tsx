// TODO: 
// 1. User management & user role
//  1.1 (OK) User registeration time should be recorded.
//  1.2 (OK) User can assign a name for himself when signing up.
// 2. Document and project management
//  2.1 (OK) Project & document & user data schema definition.
//  2.2 Project creation & management & permission control
//  2.3 Document creation & management & claim / permission control / state control
//  2.4 Document editors: intro, curriculum, quiz, doc support
// 3. File upload support
//  3.1 Attachment editor
// 4. Video player & subtitle editor
// 5. File import & auto transcript/translate
// 6. Test & optimize
// 7. First version release

// FIX:
// 1. User should be unable to open signin page after logged in.
// 2. A notfication should be shown up after signing up with email.
// 3. Credential is currently saved as plain text in db.

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
