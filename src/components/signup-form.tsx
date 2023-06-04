"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { api } from "~/utils/api";
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
import { Checkbox } from "~/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"

const formSchema = z.object({
  email: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }).email("This is not a valid email."),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  acceptTerms: z.boolean()
})

export function SignupForm() {
  const router = useRouter()
  const mutation = api.user.register.useMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)

    mutation.mutate({
      email: values.email,
      password: values.password
    })

    signIn("email", { email: values.email, redirect: false }).then((result) => {
      if (result && result.ok) {
        console.log("ok")
      }
    })
  }

  return (
    <Card className={"w-[480px]"}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password confirm</FormLabel>
                  <FormControl>
                    <Input placeholder="•••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>
                    Accept terms and conditions
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">Sign Up</Button>
            <p>Already have an account? <Button variant="link" onClick={() => router.push("/signin")}>Sign in</Button></p>
          </form>
        </Form>

      </CardContent>
    </Card>
  )
}

