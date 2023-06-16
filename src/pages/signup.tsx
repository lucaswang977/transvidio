import type { NextPageWithLayout } from './_app'
import { SignupForm } from "~/components/signup-form"
import { Logo } from "~/components/logo-with-name"
import { useRouter } from "next/router"

const SignUp: NextPageWithLayout = () => {
  const router = useRouter()

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Logo onClick={() => router.push("/")} />
        <SignupForm />
      </main>
    </>
  )
}

SignUp.getTitle = () => "Sign up on Transvidio"

export default SignUp;
