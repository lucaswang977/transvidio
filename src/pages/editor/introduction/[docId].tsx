// https://www.udemy.com/api-2.0/courses/673654/?fields[course]=title,headline,description,prerequisites,objectives,target_audiences
// {
// "_class": "course",
// "id", 12345,
// "title": "text",
// "headeline": "text",
// "description": "HTML",
// "prerequisites": [text, text],
// "objectives": [text, text],
// "target_audiences": [text, text]
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { api } from "~/utils/api";
import * as z from "zod"
import { useSession } from "next-auth/react"

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "~/components/ui/form"

const formSchema = z.object({
  title: z.string().nonempty(),
  description: z.string(),
  headline: z.string(),
  prerequisites: z.string().array(),
  objectives: z.string().array(),
  target_audiences: z.string().array()
})

const EditoForm = (props: { values: z.infer<typeof formSchema>, docId: string, target: "source" | "destination" }) => {
  const mutation = api.document.save.useMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: props.values
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)

    mutation.mutate({
      documentId: props.docId,
      target: props.target,
      data: JSON.stringify(values)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headline</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prerequisites"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prerequisites</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="objectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>objectives</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_audiences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target audiences</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>

  )
}

const IntroductionEditor: NextPage = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const { data: doc } = api.document.load.useQuery(
    { documentId: docId },
    { enabled: session?.user !== undefined }
  )
  const srcJson = doc?.srcJson?.toString()
  const dstJson = doc?.srcJson?.toString()
  console.log(srcJson, dstJson)
  const srcObj: z.infer<typeof formSchema> = JSON.parse(srcJson ? srcJson : "{}")
  const dstObj: z.infer<typeof formSchema> = JSON.parse(dstJson ? dstJson : "{}")

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Introduction Document Editor</h2>
        <p>Document Id: {docId}</p>
      </div>
      <div className="flex items-center justify-between space-y-2">
        <EditoForm docId={docId} target="source" values={srcObj} />
        <EditoForm docId={docId} target="destination" values={dstObj} />
      </div>
    </div>
  )
}

export default IntroductionEditor
