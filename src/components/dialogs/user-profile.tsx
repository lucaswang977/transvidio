"use client"

import * as React from "react"
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { useToast } from "~/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { Separator } from "~/components/ui/separator"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { PaymentMethod } from "@prisma/client"
import type { Currency } from "@prisma/client"
import type { UserProfile } from "~/types"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { extractLetters } from "~/utils/helper"

type UserProfileDialogProps = {
  trigger: JSX.Element,
  disabled?: boolean,
  refetch?: () => void
}

export function UserProfileDialog(props: UserProfileDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const { data: sessionData, update } = useSession();
  const [data, setData] = React.useState<UserProfile | undefined>(undefined)
  const mutation = api.user.updateProfile.useMutation()
  const { toast } = useToast()
  api.user.getProfile.useQuery(
    undefined,
    {
      enabled: sessionData?.user.id !== undefined && open,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        setData(res)
      }
    })

  const handleSubmit = () => {
    if (data) {
      setWorking(true)

      mutation.mutate({
        name: data.name,
        image: data.avatar === null ? undefined : data.avatar,
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentTarget: data.paymentTarget,
        paymentCurrency: data.paymentCurrency as Currency
      }, {
        onError: (err) => {
          toast({ description: err.message })
          setOpen(false)
          setWorking(false)
        },
        onSuccess: async () => {
          if (props.refetch) props.refetch()
          await update()
          toast({ title: "Profile updated" })
          setOpen(false)
          setWorking(false)
        }
      })


    }
  }

  return (
    <DropdownMenuDialogItem
      onOpenChange={setOpen}
      open={open}
      disabled={props.disabled || !sessionData?.user.id}
      triggerChildren={props.trigger}>
      <DialogHeader>
        <DialogTitle>Profile</DialogTitle>
        <Separator className="my-6" />
      </DialogHeader>
      {
        data ?
          <>
            <div className="flex text-sm flex-col space-y-6 w-[300px]">
              <div className="flex w-full justify-center">
                <Avatar className="h-20 w-20 items-center">
                  <AvatarImage src={data.avatar} alt="avatar" />
                  <AvatarFallback>{extractLetters(data.name)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col space-y-1">
                <p>Name</p>
                <Input
                  className="h-10"
                  value={data.name}
                  onChange={(ev) => {
                    setData((d) => {
                      if (d) {
                        return {
                          ...d,
                          name: ev.currentTarget.value
                        }
                      }
                      return d
                    })
                  }} />
              </div>
              <div className="flex flex-col space-y-1">
                <p>Payment method</p>
                <Select
                  value={data.paymentMethod as string}
                  onValueChange={(v) => {
                    setData(d => {
                      let currency: Currency | null = null
                      if (v === "Alipay") currency = "CNY"
                      else if (v === "PayPal") currency = "USD"

                      if (d) return { ...d, paymentMethod: v, paymentCurrency: currency }
                      return d
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Payment method</SelectLabel>
                      {Object.values(PaymentMethod).map((m) =>
                        <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select >
                {
                  data.paymentCurrency &&
                  <p className="text-xs text-gray-500">* Your incoming will be paid in {data.paymentCurrency}.</p>
                }

              </div>
              <div className="flex flex-col space-y-1">
                <p>Payment receiving account</p>
                <Input
                  className="w-full h-10"
                  value={data.paymentTarget}
                  onChange={(ev) => {
                    setData((d) => {
                      if (d) {
                        return {
                          ...d,
                          paymentTarget: ev.currentTarget.value
                        }
                      }
                      return d
                    })
                  }} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={working}
                onClick={() => { handleSubmit() }}>
                {working ? "Waiting" : "Save"}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </DialogFooter>
          </>
          :
          <div className="w-[300px] h-[200px] flex justify-center items-center">
            <Loader2 className="animate-spin" />
          </div>
      }
    </DropdownMenuDialogItem>
  )
}


