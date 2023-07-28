import * as React from "react"
import { api } from "~/utils/api";
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useSession } from "next-auth/react"
import { Button } from "~/components/ui/button"
import { DocumentType } from "@prisma/client";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast"
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
import { AppConfigKeys } from "~/utils/helper"
import { Loader2 } from "lucide-react";

export type AppConfigDialogProps = {
  trigger: JSX.Element,
  open: boolean,
  setOpen: (open: boolean) => void,
  disabled?: boolean,
}

const AppConfigDialog = (props: AppConfigDialogProps) => {
  const [appConfig, setAppConfig] = React.useState<AppConfig[]>([])
  const { data: session } = useSession();
  const [working, setWorking] = React.useState(false)
  const { toast } = useToast()
  const mutation = api.config.update.useMutation()
  const { isFetching } = api.config.getAll.useQuery(
    undefined,
    {
      enabled: (
        session !== null &&
        session.user !== undefined &&
        session.user.role === "ADMIN" &&
        props.open),
      refetchOnWindowFocus: false,
      onSuccess: (result) => {
        setAppConfig(result)
      },
    },
  )

  const handleConfirm = (setOpen: (t: boolean) => void) => {
    setWorking(true)
    mutation.mutate(appConfig,
      {
        onSuccess: () => {
          setWorking(false)
          setOpen(false)
        },
        onError: (err) => {
          toast({ title: err.message })
          setWorking(false)
          setOpen(false)
        }
      })
  }

  const openaiGptModelKey = AppConfigKeys.GPT_MODEL
  const exrUsdJpyKey = `${AppConfigKeys.EXCHANGE_RATE_PREFIX}USDJPY`
  const exrUsdCnyKey = `${AppConfigKeys.EXCHANGE_RATE_PREFIX}USDCNY`

  const general_openaiGptModel = appConfig.find(i => i.key === openaiGptModelKey)
  const exrUsdJpy = appConfig.find(i => i.key === exrUsdJpyKey)
  const exrUsdCny = appConfig.find(i => i.key === exrUsdCnyKey)

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
      {
        isFetching ?
          <Loader2 className="animate-spin" />
          :
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
                      const t = obj.find(i => i.key === openaiGptModelKey)
                      if (t) t.value = e
                      else obj.push({ key: openaiGptModelKey, value: e })

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
              <p className="text-sm">Exchange Rates:</p>
              <div className="flex">
                <p className="text-sm">USD-JPY</p>
                <Input
                  placeholder="0.01"
                  step="0.10"
                  type="number"
                  value={parseFloat(exrUsdJpy ? exrUsdJpy.value : "0").toFixed(2)}
                  onChange={(e) => {
                    setAppConfig(v => {
                      const c = v.find(i => i.key === exrUsdJpyKey)
                      if (c) c.value = e.currentTarget.value
                      else v.push({
                        key: exrUsdJpyKey,
                        value: e.currentTarget.value
                      })

                      return [...v]
                    })
                  }} />

              </div>
              <div className="flex">
                <p className="text-sm">USD-CNY</p>
                <Input
                  placeholder="0.01"
                  step="0.10"
                  type="number"
                  value={parseFloat(exrUsdCny ? exrUsdCny.value : "0").toFixed(2)}
                  onChange={(e) => {
                    setAppConfig(v => {
                      const c = v.find(i => i.key === exrUsdCnyKey)
                      if (c) c.value = e.currentTarget.value
                      else v.push({
                        key: exrUsdCnyKey,
                        value: e.currentTarget.value
                      })

                      return [...v]
                    })
                  }} />
              </div>
            </TabsContent>
            <TabsContent className="p-4" value="cost">
              <div className="grid grid-cols-3 space-y-1 w-3/4 items-center">
                {
                  Object.keys(DocumentType).map((name) => {
                    const key = `${AppConfigKeys.BASIC_COST_PREFIX}${name}`
                    const o = appConfig.find(i => i.key === key)
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
                              const c = v.find(i => i.key === key)
                              if (c) c.value = e.currentTarget.value
                              else v.push({
                                key: key,
                                value: e.currentTarget.value
                              })

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
      }
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
