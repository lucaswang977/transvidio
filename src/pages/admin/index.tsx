import { type NextPage } from "next"
import { Download } from "lucide-react"
import { Button } from "~/components/ui/button";
import Layout from "./layout"

const Dashboard: NextPage = () => {

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </Layout>

  )
}

export default Dashboard
