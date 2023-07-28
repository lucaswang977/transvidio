"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "~/components/ui/checkbox"
import type { Currency, PaymentMethod, PayoutStatus } from "@prisma/client"
import { extractLetters, truncateString } from "~/utils/helper"
import { naturalTime } from "~/utils/helper"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"

export type PayoutColumn = {
  id: string
  project: { id: string, name: string }
  user: { id: string, name: string, image: string }
  currency: Currency
  number: number
  exchangeRate: number
  method: PaymentMethod
  status: PayoutStatus
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar key={user.id} className="h-8 w-8">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{extractLetters(user.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>)
      }
      return <>
        {avatarUI}
      </>
    },
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: ({ row }) => {
      const currency: Currency = row.getValue("currency")
      if (currency === "USD")
        return (<p>🇺🇸 $USD</p>)
      else if (currency === "CNY")
        return (<p>🇨🇳 ¥CNY</p>)
      else if (currency === "JPY")
        return (<p>🇯🇵 ¥JPY</p>)
    }
  },
  {
    accessorKey: "number",
    header: "Amount",
    cell: ({ row }) => {
      const data = row.original
      const number = data.number * data.exchangeRate
      return <p>{data.currency === "USD" ? "$" : "¥"}{number.toFixed(2)}</p>
    }
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
    header: "Payment Method"
  },
  {
    accessorKey: "incomeCount",
    header: "Income Records"
  },
  {
    accessorKey: "state",
    header: "State",
  },
  {
    accessorKey: "target",
    header: "Payment Target",
  },
  {
    accessorKey: "updated",
    header: "Updated time",
    cell: ({ row }) => {
      return naturalTime(row.getValue("updated"))
    }
  }
]
