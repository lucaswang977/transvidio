import { SigninForm } from "~/components/signin-form"
import { Logo } from "~/components/logo-with-name"
import { useRouter } from "next/router"
import type { NextPageWithLayout } from './_app'

const SignIn: NextPageWithLayout = () => {
  const router = useRouter()

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Logo onClick={() => router.push("/")} />
        <SigninForm />
      </main>
    </>

  );
}

SignIn.getTitle = () => "Sign in to Transvid.io"

export default SignIn;
