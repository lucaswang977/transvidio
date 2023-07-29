import * as React from "react"
import Layout from "./layout"
import { DataTable } from "~/components/ui/data-table"
import type { NextPageWithLayout } from "../_app"
import type { PayoutColumn } from "~/components/columns/payout"
import { columns } from "~/components/columns/payout"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button"
import { RefreshCw } from "lucide-react"

const PayoutsManagement: NextPageWithLayout = () => {
  const [rowSelection, setRowSelection] = React.useState({})
  const [data, setData] = React.useState<PayoutColumn[]>([])
  const { data: session } = useSession();
  const { isFetching, isLoading, isPreviousData, refetch } = api.income.getMyPayouts.useQuery(
    undefined, // no input
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false,
      onSuccess: (res) => {
        setData(res.map(i => {
          return {
            id: i.id,
            project: { id: i.project.id, name: i.project.name },
            user: { id: i.user.id, name: i.user.name, image: i.user.image },
            currency: i.paymentCurrency,
            number: i.number,
            exchangeRate: i.exchangeRate,
            method: i.paymentMethod,
            status: i.status,
            target: i.paymentTarget,
            updated: i.updatedAt,
            incomeCount: i.incomeRecords.length
          } as PayoutColumn
        }))
      }
    },
  );

  const handleRefetch = async () => {
    await refetch()
  }
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All payouts</h2>
        <div className="flex space-x-2">
          <Button disabled={isFetching} size="sm" variant="outline" onClick={handleRefetch}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {(isFetching) ? "Loading" : "Refresh"}
          </Button>
        </div>

      </div>
      <div>
        <DataTable
          disabled={isLoading || isPreviousData}
          columns={columns}
          data={data}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          manualPagination={false}
        />
      </div>
    </div>
  )
}

PayoutsManagement.getTitle = () => "Payouts - Transvid.io"
PayoutsManagement.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default PayoutsManagement
