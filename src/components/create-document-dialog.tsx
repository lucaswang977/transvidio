"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { DocumentType } from "@prisma/client"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import * as z from "zod"

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "~/components/ui/form"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

const formSchema = z.object({
  project: z.string().nonempty(),
  title: z.string().nonempty(),
  type: z.nativeEnum(DocumentType),
  srcJson: z.string().optional(),
  seq: z.number().optional(),
})

type ProjectInfo = {
  id: string,
  name: string
}

export function DocumentCreateDialog(props: { refetch: () => void }) {
  const [open, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { data: sessionData } = useSession();
  const mutation = api.document.create.useMutation()
  const { data: projectData } = api.project.getAll.useQuery(
    undefined, // no input
    {
      enabled: sessionData?.user !== undefined && sessionData.user.role === "ADMIN",
      refetchOnWindowFocus: false
    },
  );

  let projects: ProjectInfo[] = []

  if (projectData) {
    projects = projectData.map((project) => {
      const p: ProjectInfo = {
        id: project.id,
        name: project.name,
      }

      return p
    })
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      seq: 9999
    },
    mode: "onChange"
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    mutation.mutate({
      projectId: values.project,
      title: values.title,
      type: values.type,
      srcJson: values.srcJson,
      seq: values.seq
    }, {
      onError: (err) => {
        console.log(err)
        setIsOpen(false)
        setLoading(false)
      },
      onSuccess: () => {
        props.refetch()
        setIsOpen(false)
        setLoading(false)
      }
    })
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-28" variant="outline" onClick={() => { form.reset() }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New
          </Button>
        </DialogTrigger>
        <DialogContent className="w-1/3">
          <DialogHeader>
            <DialogTitle>Create a new document</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue="enUS">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Project</SelectLabel>
                            {projects ?
                              projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                              : <span>Loading</span>}
                          </SelectGroup>
                        </SelectContent>
                      </Select >
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v as DocumentType)
                          }}
                          defaultValue="enUS">
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Types</SelectLabel>
                              {Object.values(DocumentType).map((lang) =>
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                            </SelectGroup>
                          </SelectContent>
                        </Select >
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seq"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seq #</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="h-10"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="srcJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source JSON</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button disabled={loading} type="submit">{loading ? "Creating" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  )
}

