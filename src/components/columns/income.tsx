"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "~/components/ui/checkbox"
import type { DocumentType } from "@prisma/client"
import { getDocTypeBadges } from "~/components/columns/documents"

export type IncomeColumn = {
  project: string
  document: string
  documentType: DocumentType
  date: Date
  number: number
  wordCount: number
  rate: number
  payoutId?: string
}

export const columns: ColumnDef<IncomeColumn>[] = [
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
  },
  {
    accessorKey: "document",
    header: "Document Title",
  },
  {
    accessorKey: "documentType",
    header: "Document Type",
    cell: ({ row }) => {
      const docType: DocumentType = row.getValue("documentType")
      return getDocTypeBadges(docType)
    }

  },
  {

    accessorKey: "date",
    header: "Create at",
    cell: ({ row }) => {
      const date: Date = row.getValue("date")
      return (<p>{date.toLocaleString()}</p>)
    }
  },
  {
    accessorKey: "number",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("number")).toFixed(2)
      return (<p>{`$${amount}`}</p>)
    }
  },
  {
    accessorKey: "wordCount",
    header: "Word Count"
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("rate")).toFixed(2)
      return (<p>{`$${rate}`}</p>)
    }
  },
  {
    accessorKey: "payoutId",
    header: "Payout ID",
    cell: ({ row }) => {
      const payoutId = row.getValue("payoutId")
      return (payoutId ? payoutId : "Unpaid")
    }
  }
]
