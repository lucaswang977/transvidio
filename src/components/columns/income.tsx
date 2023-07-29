"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DocumentType } from "@prisma/client"
import { getDocTypeBadges } from "~/components/columns/documents"

export type IncomeColumn = {
  project: string
  document: string
  documentType: DocumentType
  documentSeq: number
  date: Date
  number: number
  wordCount: number
  rate: number
  payout?: string
}

export const columns: ColumnDef<IncomeColumn>[] = [
  {
    accessorKey: "documentSeq",
    header: "# Seq",
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
    accessorKey: "number",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("number")).toFixed(2)
      return (<p className="font-bold">{`$${amount}`}</p>)
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
      return (<p className="italic">{`$${rate}`}</p>)
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
]
