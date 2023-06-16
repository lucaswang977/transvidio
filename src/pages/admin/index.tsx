import Layout from "./layout"
import { type NextPageWithLayout } from "../_app"

const Dashboard: NextPageWithLayout = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
    </div>
  )
}

Dashboard.getTitle = () => "Dashboard - Transvid.io"
Dashboard.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Dashboard
