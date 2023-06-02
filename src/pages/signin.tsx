import { type NextPage } from "next";
import Head from "next/head";
import { SigninForm } from "~/components/signin-form"
import { Logo } from "~/components/logo-with-name"

const SignIn: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sign In - Transvid.io</title>
        <meta name="description" content="Help your courses to go global." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Logo />
        <SigninForm />
      </main>
    </>

  );
}

export default SignIn;
