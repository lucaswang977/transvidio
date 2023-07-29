"use client"

import * as React from "react"
import { DataTable } from "~/components/ui/data-table"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import type { IncomeColumn } from "~/components/columns/income"
import { columns as incomeColumns } from "~/components/columns/income"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { Separator } from "~/components/ui/separator"
import { Loader2 } from "lucide-react"

type UserIncomeDialogProps = {
  trigger: JSX.Element,
  payoutId?: string,
  userId?: string,
  disabled?: boolean,
  refetch?: () => void
}

export function UserIncomeDialog(props: UserIncomeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { data: sessionData } = useSession();
  const [rowSelection, setRowSelection] = React.useState({})
  const [incomeData, setIncomeData] = React.useState<IncomeColumn[] | undefined>(undefined)
  api.income.getMyIncome.useQuery(
    {
      payoutId: props.payoutId,
      userId: props.userId
    },
    {
      enabled: sessionData?.user.id !== undefined && open,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        setIncomeData(res.map((income) => {
          const r: IncomeColumn = {
            project: income.project.name,
            document: income.document.title,
            documentType: income.document.type,
            documentSeq: income.document.seq,
            date: income.createdAt,
            number: income.number,
            wordCount: income.wordCount,
            rate: income.rate,
            payout: income.payoutRecord ? income.payoutRecord.status : undefined
          }

          return r
        }))
      }
    })
  const total = incomeData ? incomeData.reduce((acc, v) => acc + v.number, 0) : 0
  return (
    <Dialog
      onOpenChange={setOpen}
      open={open} >
      <DialogTrigger asChild>
        {props.trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Income</DialogTitle>
          <Separator className="my-6" />
        </DialogHeader>
        {
          incomeData ?
            <div className="flex flex-col space-y-2">
              <p className="text-sm italic">Total: ${total.toFixed(2)}</p>
              <DataTable
                columns={incomeColumns}
                data={incomeData}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                manualPagination={false}
              />
              <div className="p-2">
                <p className="text-xs text-gray-500">* Amount is how much you will earn when the document is closed, in US Dollars.</p>
                <p className="text-xs text-gray-500">* Rate is what you earned in US Dollars per thousand words.</p>
              </div>
            </div>
            :
            <div className="w-[300px] h-[200px] flex justify-center items-center">
              <Loader2 className="animate-spin" />
            </div>
        }
      </DialogContent>
    </Dialog>

  )
}


