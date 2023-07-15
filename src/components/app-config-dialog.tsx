import * as React from "react"
import { api } from "~/utils/api";
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useSession } from "next-auth/react"
import { Button } from "~/components/ui/button"
import type { AppConfig } from "@prisma/client";
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

export type AppConfigDialogProps = {
  trigger: JSX.Element,
  open: boolean,
  setOpen: (open: boolean) => void,
  disabled?: boolean,
}

const AppConfigDialog = (props: AppConfigDialogProps) => {
  const { data: session } = useSession();
  const [working, setWorking] = React.useState(false)
  const mutation = api.config.update.useMutation()
  const { data: result } = api.config.getAll.useQuery(
    undefined,
    {
      enabled: (session !== null && session.user !== undefined && session.user.role === "ADMIN"),
      refetchOnWindowFocus: false,
    },
  )

  const configData = result as AppConfig[]
  // gpt model
  // basic cost

  const handleConfirm = () => {
    setWorking(true)
    setWorking(false)
  }

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
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>
        <TabsContent className="p-4" value="general">
          <div className="flex space-x-2 items-center">
            <p className="text-sm">OpenAI GPT model:</p>
            <Select onValueChange={(e) => { console.log(e) }} defaultValue="gpt-3.5-turbo">
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
                return (
                  <>
                    <p className="text-sm col-span-1">{name}</p>
                    <Input
                      className="col-span-2"
                      placeholder="0.0"
                      onChange={(e) => { console.log(e.currentTarget.value) }} />
                  </>
                )
              })
            }
          </div>
          <p className="text-xs mt-4">* the currency is in US dollar.</p>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <Button
          disabled={working}
          onClick={() => {
            handleConfirm()
            props.setOpen(false)
          }}>{working ? "Saving" : "Save"}</Button>
      </DialogFooter>
    </DropdownMenuDialogItem>
  )
}

export default AppConfigDialog
