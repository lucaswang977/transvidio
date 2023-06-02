import { type NextPage } from "next";
import Head from "next/head";
import { SignupForm } from "~/components/signup-form"

const SignUp: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sign Up - Transvid.io</title>
        <meta name="description" content="Help your courses to go global." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <SignupForm />
      </main>
    </>

  )
}

export default SignUp;
