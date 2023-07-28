"use client"

import * as React from "react"
import { DataTable } from "~/components/ui/data-table"

import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogHeader, DialogTitle } from "~/components/ui/dialog"
import type { IncomeColumn } from "~/components/columns/income"
import type { PayoutColumn } from "~/components/columns/payout"
import { columns as incomeColumns } from "~/components/columns/income"
import { columns as payoutColumns } from "~/components/columns/payout"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { Separator } from "~/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Loader2 } from "lucide-react"

type UserIncomeDialogProps = {
  trigger: JSX.Element,
  disabled?: boolean,
  refetch?: () => void
}

export function UserIncomeDialog(props: UserIncomeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { data: sessionData } = useSession();
  const [rowSelection, setRowSelection] = React.useState({})
  const [incomeData, setIncomeData] = React.useState<IncomeColumn[]>([])
  const [payoutData, setPayoutData] = React.useState<PayoutColumn[]>([])
  api.income.getMyPayouts.useQuery(
    undefined,
    {
      enabled: sessionData?.user.id !== undefined && open,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        setPayoutData(res.map((i) => {
          const r: PayoutColumn = {
            id: i.id,
            project: { id: i.project.id, name: i.project.name },
            user: { id: i.user.id, name: i.user.name ? i.user.name : "", image: i.user.image ? i.user.image : "" },
            currency: i.paymentCurrency,
            number: i.number,
            exchangeRate: i.exchangeRate,
            method: i.paymentMethod,
            status: i.status,
            target: i.paymentTarget,
            updated: i.updatedAt,
            incomeCount: i.incomeRecords.length
          }

          return r
        }))
      }
    })

  api.income.getMyIncome.useQuery(
    undefined,
    {
      enabled: sessionData?.user.id !== undefined && open,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        setIncomeData(res.map((income) => {
          const r: IncomeColumn = {
            project: income.project.name,
            document: income.document.title,
            documentType: income.document.type,
            date: income.createdAt,
            number: income.number,
            wordCount: income.wordCount,
            rate: income.rate,
            payoutId: income.payoutRecord ? income.payoutRecord.id : undefined
          }

          return r
        }))
      }
    })
  let unpaid = 0
  if (incomeData) {
    incomeData.forEach(d => {
      unpaid += d.number
    })
  }

  return (
    <DropdownMenuDialogItem
      onOpenChange={setOpen}
      open={open}
      disabled={props.disabled || !sessionData?.user.id}
      triggerChildren={props.trigger}>
      <DialogHeader>
        <DialogTitle>Income</DialogTitle>
        <Separator className="my-6" />
      </DialogHeader>
      <Tabs defaultValue="income" className="w-fit">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        <TabsContent className="flex flex-col space-y-2 p-4" value="income">
          {
            incomeData ?
              <>
                <p className="text-xs">Total unpaid: <em>${unpaid.toFixed(2)}</em></p>
                <DataTable
                  columns={incomeColumns}
                  data={incomeData}
                  rowSelection={rowSelection}
                  setRowSelection={setRowSelection}
                  manualPagination={false}
                />
                <div className="p-2">
                  <p className="text-xs text-gray-500">* Amount is what you earned when the document is closed, which is in the US Dollars.</p>
                  <p className="text-xs text-gray-500">* Rate is what you earned in US Dollars per thousand words.</p>
                  <p className="text-xs text-gray-500">* Payout ID will be created when the project is completed.</p>
                </div>
              </>
              :
              <Loader2 className="animate-spin" />
          }
        </TabsContent>
        <TabsContent className="flex flex-col space-y-2 p-4" value="payment">
          {
            payoutData ?
              <DataTable
                columns={payoutColumns}
                data={payoutData}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                manualPagination={false}
              />
              :
              <Loader2 className="animate-spin" />
          }
        </TabsContent>
      </Tabs>
    </DropdownMenuDialogItem>

  )
}


