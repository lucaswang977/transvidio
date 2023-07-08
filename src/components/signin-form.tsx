"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { Icons } from "~/components/ui/icons"
import * as z from "zod"
import * as React from "react"

import { Button } from "~/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card"
import { Loader2 } from "lucide-react"
import { Label } from "./ui/label"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }).email("This is not a valid email."),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  })
})

export function SigninForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [failedMessage, setFailedMessage] = React.useState<string | null>(null)
  const [passwordInputFocused, setPasswordInputFocused] = React.useState(false)
  const [emailInputFocused, setEmailInputFocused] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onSubmit",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    }).then(async (result) => {
      if (result) {
        if (result.ok) {
          console.log(result)
          await router.push("/admin")
        } else {
          if (result.error) setFailedMessage(result.error)
        }
      }
      form.reset()
      setLoading(false)
    })
  }

  return (
    <Card className={"w-full md:w-[480px]"}>
      <CardHeader>
        <CardTitle>Sign in with your account.</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={emailInputFocused ? "" : "Your email address please."}
                      {...field}
                      onFocus={() => setEmailInputFocused(true)}
                      onBlur={() => setEmailInputFocused(false)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={passwordInputFocused ? "" : "••••••"}
                      type="password"
                      {...field}
                      onFocus={() => setPasswordInputFocused(true)}
                      onBlur={() => setPasswordInputFocused(false)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col w-full space-y-6 items-center">
              <div className="flex flex-col space-y-2 w-full items-center">
                <Button
                  disabled={loading}
                  className="w-full"
                  type="submit">
                  {loading ? <Loader2 className="w-4 animate-spin" /> : "Sign In"}
                </Button>
                <Label className={failedMessage ? "text-red-400" : "hidden"}>{failedMessage}</Label>
              </div>
              <Button
                disabled={loading}
                variant="outline" type="button" className="w-full"
                onClick={async () => {
                  await signIn("google", { callbackUrl: "/admin" })
                }}>
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">Don&apos;t have an account yet?
          <Link className="ml-3 text-gray-800" href="/signup">Sign up</Link>
        </p>
      </CardFooter>

    </Card>
  )
}

