import { type NextPage } from "next"
import Layout from "./layout"

const ProjectManagement: NextPage = () => {

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Project management</h2>
        </div>
      </div>
    </Layout>

  )
}

export default ProjectManagement
