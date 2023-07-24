import * as React from "react"
import { api } from "~/utils/api";
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useSession } from "next-auth/react"
import { Button } from "~/components/ui/button"
import { DocumentType } from "@prisma/client";
import { Separator } from "~/components/ui/separator";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { clone } from "ramda";
import type { AppConfig } from "~/types";

export type AppConfigDialogProps = {
  trigger: JSX.Element,
  open: boolean,
  setOpen: (open: boolean) => void,
  disabled?: boolean,
}

const AppConfigDialog = (props: AppConfigDialogProps) => {
  const [appConfig, setAppConfig] = React.useState<AppConfig[]>([])
  const [origConfig, setOrigConfig] = React.useState<AppConfig[]>([])
  const { data: session } = useSession();
  const [working, setWorking] = React.useState(false)
  const mutation = api.config.update.useMutation()
  const { isFetching } = api.config.getAll.useQuery(
    undefined,
    {
      enabled: (session !== null && session.user !== undefined && session.user.role === "ADMIN"),
      refetchOnWindowFocus: false,
      onSuccess: (result) => {
        const obj = clone(result)
        setAppConfig(result)
        setOrigConfig(obj)
      }
    },
  )

  const handleConfirm = (setOpen: (t: boolean) => void) => {
    setWorking(true)
    for (const c of appConfig) {
      const orig = origConfig.find(i => i.key === c.key)
      if (!orig || orig.value !== c.value) {
        mutation.mutate({
          value: c.value,
          key: c.key
        },
          {
            onSuccess: () => {
              setWorking(false)
              setOpen(false)
            }
          })
      }
    }
  }

  const general_openaiGptModel = appConfig.find(i => i.key === "general_openaiGptModel")

  return (
    <DropdownMenuDialogItem
      onOpenChange={props.setOpen}
      open={props.open}
      disabled={props.disabled}
      triggerChildren={props.trigger}>
      <DialogHeader>
        <DialogTitle>Global configuration</DialogTitle>
        <DialogDescription>
          Be cautious! Modification on those parameters may cause system running unstably.
        </DialogDescription>
        <Separator className="my-6" />
      </DialogHeader>
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cost">Basic Cost</TabsTrigger>
        </TabsList>
        <TabsContent className="p-4" value="general">
          <div className="flex space-x-2 items-center">
            <p className="text-sm">OpenAI GPT model:</p>
            <Select
              onValueChange={(e) => {
                setAppConfig(c => {
                  const obj = clone(c)
                  const t = obj.find(i => i.key === "general_openaiGptModel")
                  if (t) t.value = e
                  else obj.push({ key: "general_openaiGptModel", value: e })

                  return obj
                })
              }}
              defaultValue={general_openaiGptModel ? general_openaiGptModel.value : "gpt-3.5-turbo"}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="GPT Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo-0301">gpt-3.5-turbo-0301</SelectItem>
                <SelectItem value="gpt-3.5-turbo-16k-0613">gpt-3.5-turbo-16k-0613</SelectItem>
                <SelectItem value="gpt-4">gpt-4</SelectItem>
                <SelectItem value="gpt-4-0613">gpt-4-0613</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        <TabsContent className="p-4" value="cost">
          <div className="grid grid-cols-3 space-y-1 w-3/4 items-center">
            {
              Object.keys(DocumentType).map((name) => {
                const o = appConfig.find(i => i.key === `basicCost_${name}`)
                const v = o ? o.value : "0"
                return ([
                  <p key={`p-${name}`} className="text-sm col-span-1">{name}</p>,
                  <div key={`d-${name}`} className="items-center col-span-2 flex space-x-1 text-gray-400">
                    <span >$</span>
                    <Input
                      placeholder="0.01"
                      step="0.10"
                      type="number"
                      value={parseFloat(v).toFixed(2)}
                      onChange={(e) => {
                        setAppConfig(v => {
                          const c = v.find(i => i.key === `basicCost_${name}`)
                          if (c) c.value = e.currentTarget.value
                          else v.push({ key: `basicCost_${name}`, value: e.currentTarget.value })

                          return [...v]
                        })
                      }} />
                  </div>
                ])
              })
            }
          </div>
          <p className="text-xs mt-4 text-gray-500">* the currency is in US dollar.</p>
          <p className="text-xs text-gray-500">* modification will only affect newly created payment records.</p>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <Button
          disabled={working || isFetching}
          onClick={() => {
            handleConfirm(props.setOpen)
          }}>
          {working ? "Saving" : isFetching ? "Loading" : "Save"}
        </Button>
      </DialogFooter>
    </DropdownMenuDialogItem >
  )
}

export default AppConfigDialog
