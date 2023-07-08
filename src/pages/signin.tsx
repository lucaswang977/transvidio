import { SigninForm } from "~/components/signin-form"
import { Logo } from "~/components/logo-with-name"
import type { NextPageWithLayout } from './_app'
import Link from "next/link"

const SignIn: NextPageWithLayout = () => {

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4 px-4">
        <Link href="/"><Logo /></Link>
        <SigninForm />
      </main>
    </>

  );
}

SignIn.getTitle = () => "Sign in to Transvid.io"

export default SignIn;
