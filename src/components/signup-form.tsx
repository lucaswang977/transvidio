"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { api } from "~/utils/api";
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
import { Checkbox } from "~/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from "~/components/ui/card"
import { Loader2 } from "lucide-react"
import { Label } from "./ui/label"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().min(5, {
    message: "Email must be at least 5 characters.",
  }).email("This is not a valid email."),
  name: z.string().min(3, {
    message: "Name must be at least 3 characters."
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  acceptTerms: z.boolean()
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: "custom",
      message: "Passwords do not match."
    })
  }
})

export function SignupForm() {
  const [loading, setLoading] = React.useState(false)
  const mutation = api.user.register.useMutation()
  const [failedMessage, setFailedMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [pwdInputFocused, setPwdInputFocused] = React.useState(false)
  const [pwdConfirmInputFocused, setPwdConfirmInputFocused] = React.useState(false)
  const [emailInputFocused, setEmailInputFocused] = React.useState(false)
  const [nameInputFocused, setNameInputFocused] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false
    },
    mode: "onChange"
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    mutation.mutate({
      email: values.email,
      name: values.name,
      password: values.password
    }, {
      onError: (err) => {
        setFailedMessage(err.message)
        setLoading(false)
      },
      onSuccess: (data) => {
        if (data) {
          signIn("email", {
            email: values.email,
            redirect: false,
            callbackUrl: "/signin"
          }).then(result => {
            if (result) {
              setSuccessMessage(`A verification email has been sent to ${values.email}.`)
            }
            setLoading(false)
          }).catch((err: Error) => {
            setFailedMessage(err.message)
            setLoading(false)
          })
        }
      },
    })
    form.reset()
  }

  return (
    <Card className={"w-[480px]"}>
      <CardHeader>
        <CardTitle>Create an account with your email.</CardTitle>
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
                      {...field}
                      disabled={loading}
                      placeholder={emailInputFocused ? "" : "Your email address please."}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder={nameInputFocused ? "" : "Your name please."}
                      onFocus={() => setNameInputFocused(true)}
                      onBlur={() => setNameInputFocused(false)}
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
                      {...field}
                      disabled={loading}
                      type="password"
                      placeholder={pwdInputFocused ? "" : "••••••"}
                      onFocus={() => setPwdInputFocused(true)}
                      onBlur={() => setPwdInputFocused(false)}
                    />
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
                    <Input
                      {...field}
                      disabled={loading}
                      type="password"
                      placeholder={pwdConfirmInputFocused ? "" : "••••••"}
                      onFocus={() => setPwdConfirmInputFocused(true)}
                      onBlur={() => setPwdConfirmInputFocused(false)}
                    />
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
                    <Checkbox
                      checked={field.value}
                      disabled={loading}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>
                    Accept terms and conditions
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col space-y-2 w-full items-center">
              <Button
                className="w-full"
                type="submit"
                disabled={!form.watch("acceptTerms") || loading}>
                {loading ? <Loader2 className="w-4 animate-spin" /> : "Sign Up"}
              </Button>
              <Label className={failedMessage ? "text-red-400" : "hidden"}>{failedMessage}</Label>
              <Label className={successMessage ? "text-blue-400" : "hidden"}>{successMessage}</Label>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">Already have an account?
          <Link className="ml-3 text-gray-800" href="/signin">Sign in</Link>
        </p>
      </CardFooter>
    </Card >
  )
}

