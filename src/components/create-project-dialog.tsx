"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Language } from "@prisma/client"
import { api } from "~/utils/api";
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
  name: z.string().nonempty(),
  srcLang: z.nativeEnum(Language),
  dstLang: z.nativeEnum(Language),
  memo: z.string()
})

export function ProjectCreateDialog(props: { refetch: () => void }) {
  const [open, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const mutation = api.project.create.useMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      srcLang: "enUS",
      dstLang: "zhCN",
      memo: ""
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    mutation.mutate({
      name: values.name,
      srcLang: values.srcLang,
      dstLang: values.dstLang,
      memo: values.memo
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
          <Button size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            New project
          </Button>
        </DialogTrigger>
        <DialogContent className="w-1/3">
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <FormField
                  control={form.control}
                  name="srcLang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source language</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={v => {
                            field.onChange(v as Language)
                          }}
                          defaultValue="enUS">
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Languages</SelectLabel>
                              {Object.values(Language).map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
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
                  name="dstLang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target language</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={v => {
                            field.onChange(v as Language)
                          }}
                          defaultValue="zhCN">
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Languages</SelectLabel>
                              {Object.values(Language).map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                            </SelectGroup>
                          </SelectContent>
                        </Select >
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                <Button disabled={loading} type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  )
}

