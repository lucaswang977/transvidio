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
  memo: z.string().optional()
})

type ProjectInfo = {
  id: string,
  name: string
}

const getAllProjects = () => {
  const { data: sessionData } = useSession();
  const { data: projects } = api.project.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  if (projects === undefined) return null

  const projectData: ProjectInfo[] = projects.map((project) => {
    const p: ProjectInfo = {
      id: project.id,
      name: project.name,
    }

    return p
  })

  return projectData
}

export function DocumentCreateDialog() {
  const [open, setIsOpen] = React.useState(false)
  const mutation = api.document.create.useMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)

    mutation.mutate({
      projectId: values.project,
      title: values.title,
      type: values.type,
      memo: values.memo
    })

    setIsOpen(false)
  }

  const projects = getAllProjects()

  return (
    <div>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            New document
          </Button>
        </DialogTrigger>
        <DialogContent>
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
                        <SelectTrigger className="w-[200px]">
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue="enUS">
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Types</SelectLabel>
                            {Object.values(DocumentType).map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
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
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memo</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  )
}

