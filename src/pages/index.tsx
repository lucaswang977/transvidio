// TODO: 
// 1. Use Metadata to replace the Head tag
// 2. User management & user role
// 3. File upload support
// 4. Document and project management
// 5. First time deploy
// 6. Video player & subtitle editor
// 7. File import & auto transcript/translate
// 8. Test & optimize
// 9. First version release

// FIX:
// 1. User should be unable to open signin page after logged in.
// 2. A notfication should be shown up after signing up with email.

import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router"
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";
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

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
