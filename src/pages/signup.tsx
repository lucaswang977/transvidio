import type { NextPageWithLayout } from './_app'
import { SignupForm } from "~/components/signup-form"
import { Logo } from "~/components/logo-with-name"
import Link from 'next/link'

const SignUp: NextPageWithLayout = () => {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Link href="/"><Logo /></Link>
        <SignupForm />
      </main>
    </>
  )
}

SignUp.getTitle = () => "Sign up on Transvidio"

export default SignUp;
