"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "~/components/ui/checkbox"
import type { Currency, PaymentMethod, PayoutStatus } from "@prisma/client"
import { extractLetters, truncateString } from "~/utils/helper"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { tooltipWrapped } from "~/components/ui/tooltip"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { UserIncomeDialog } from "~/components/dialogs/income-dialog"
import { PayoutStatusModifyDialog } from "~/components/dialogs/payout-status-modify-dialog"

export type PayoutColumn = {
  id: string
  project: { id: string, name: string }
  user: { id: string, name: string, image: string }
  currency: Currency
  number: number
  exchangeRate: number
  method: PaymentMethod
  status: PayoutStatus
  memo: string
  target: string
  updated: Date
  incomeCount: number
}

export const columns: ColumnDef<PayoutColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => {
      const project: { id: string, name: string } = row.getValue("project")
      return (
        <div className="flex">
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {truncateString(project.name, 20)}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user: { id: string, name: string, image: string } = row.getValue("user")
      let avatarUI = <></>
      if (user) {
        avatarUI = (<div className="flex">
          {
            tooltipWrapped(
              <Avatar key={user.id} className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{extractLetters(user.name)}</AvatarFallback>
              </Avatar>
              ,
              <p>{user.name}</p>
            )
          }
        </div>)
      }
      return <>
        {avatarUI}
      </>
    },
  },
  {
    accessorKey: "number",
    header: "Amount",
    cell: ({ row }) => {
      const data = row.original
      const number = data.number * data.exchangeRate
      return <p className="font-bold">{data.currency === "USD" ? "$" : "¥"}{number.toFixed(2)}</p>
    }
  },
  {
    accessorKey: "currency",
    header: "Currency",
  },
  {
    accessorKey: "exchangeRate",
    header: "Exchange Rate",
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("exchangeRate")).toFixed(2)
      return (<p>{rate}</p>)
    }
  },
  {
    accessorKey: "method",
    header: "Method"
  },
  {
    accessorKey: "target",
    header: "Target",
  },
  {
    accessorKey: "memo",
    header: "Memo",
  },
  {
    accessorKey: "updated",
    header: "Updated",
    cell: ({ row }) => {
      const date: Date = row.getValue("updated")
      return date.toLocaleString()
    }
  },
  {
    accessorKey: "incomeCount",
    header: "Detail",
    cell: ({ row }) => {
      const count = row.getValue("incomeCount")
      const data = row.original
      return (
        <UserIncomeDialog
          payoutId={data.id}
          userId={data.user.id}
          trigger={
            <Button variant="link">{count as string} &gt;</Button>
          }
        />
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ table, row }) => {
      const data = row.original
      const myself = table.options.meta?.user
      const refetch = table.options.meta?.refetchData
      const status: PayoutStatus = row.getValue("status")
      const badge = status === "PAID" ? <Badge className="bg-gray-500">PAID</Badge>
        : status === "NOTPAID" ? <Badge className="bg-teal-500">NOT PAID</Badge>
          : status === "FROZEN" && <Badge className="bg-red-500">FROZEN</Badge>


      return (
        <div className="flex items-center space-x-1">
          {
            (myself && myself.role === "ADMIN") ?
              status !== "PAID" ?
                <PayoutStatusModifyDialog
                  refetch={() => { if (refetch) refetch() }}
                  payoutId={data.id}
                  status={status}
                  triggerChild={
                    <Button className="p-0" variant="ghost">
                      {badge}
                    </Button>
                  }
                /> : badge
              : badge
          }
        </div>
      )

    }
  },

]
