"use client"

import * as React from "react"
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
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
        image: data.avatar,
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentTarget: data.paymentTarget,
        paymentCurrency: data.paymentCurrency as Currency
      }, {
        onError: (err) => {
          console.error(err.message)
          setOpen(false)
          setWorking(false)
        },
        onSuccess: async () => {
          if (props.refetch) props.refetch()
          await update()
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
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2 items-center">
              <p>Name</p>
              <Input value={data.name} onChange={(ev) => {
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
              <Avatar className="h-10 w-10">
                <AvatarImage src={data.avatar} alt="avatar" />
                <AvatarFallback>{extractLetters(data.name)}</AvatarFallback>
              </Avatar>

            </div>
            <Separator />
            <p>Income receiving setting</p>
            <div className="flex space-x-2 items-center">
              <p>Method</p>
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
                <SelectTrigger className="w-[200px]">
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
            </div>
            <div className="flex space-x-2 items-center">
              <p>Account</p>
              <Input
                className="w-[200px] h-10"
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
            {
              data.paymentCurrency &&
              <p className="text-xs">* Payment currency will be in {data.paymentCurrency}.</p>
            }
          </div>
          :
          <Loader2 className="animate-spin" />
      }
      <DialogFooter>
        <Button
          disabled={working}
          onClick={() => { handleSubmit() }}>
          {working ? "Waiting" : "OK"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </DialogFooter>
    </DropdownMenuDialogItem>
  )
}


