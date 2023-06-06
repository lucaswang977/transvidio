import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { ProjectColumn, columns } from "~/components/columns/projects"
import { DataTable } from "~/components/ui/data-table"
import { ProjectCreateDialog } from "~/components/create-project-dialog"
import Layout from "./layout"
import { api } from "~/utils/api";

const getData = () => {
  const { data: sessionData } = useSession();
  const { data: projects } = api.project.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  if (projects === undefined) return []

  const projectsData: ProjectColumn[] = projects.map((project) => {
    const p: ProjectColumn = {
      id: project.id,
      name: project.name ? project.name : "",
      srcLang: project.srcLang,
      dstLang: project.dstLang,
      users: project.users.map((user) => {
        return {
          id: user.user.id,
          image: user.user.image,
          name: user.user.name
        }
      }),
      documents: project.documents.length
    }

    return p
  })

  return projectsData
}

const ProjectManagement: NextPage = () => {
  const { data: session } = useSession()
  const data = getData()

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">All projects</h2>
          {
            session?.user.role === "ADMIN" ?
              <ProjectCreateDialog />
              : <></>
          }
        </div>

        <DataTable columns={columns} data={data} />
      </div>
    </Layout>

  )
}

export default ProjectManagement
