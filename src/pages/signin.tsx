import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router"
import { SigninForm } from "~/components/signinForm"

const SignIn: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sign In - Transvid.io</title>
        <meta name="description" content="Help your courses to go global." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <SigninForm />
      </main>
    </>

  )
}

export default SignIn;
