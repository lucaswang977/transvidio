"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { Icons } from "~/components/ui/icons"
import * as z from "zod"

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
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    }).then((result) => {
      if (result && result.ok) {
        console.log(result)
        router.push("/admin")
      } else {
        console.log(result)
      }
    })
  }

  return (
    <Card className={"w-[480px]"}>
      <CardHeader>
        <CardTitle>Sign in to your account.</CardTitle>
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
                    <Input placeholder="Your email adress." {...field} />
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
                    <Input placeholder="•••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">Sign In</Button>
            <Button variant="outline" type="button" className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/admin" })}>
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
            <p>Don't have an account yet? <Button variant="link" onClick={() => router.push("/signup")}>Sign up</Button></p>

          </form>
        </Form>

      </CardContent>
    </Card>
  )
}

