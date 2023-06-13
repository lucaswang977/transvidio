
import * as React from "react"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { type DocumentColumn, columns } from "~/components/columns/documents"
import { DataTable } from "~/components/ui/data-table"
import Layout from "./layout"
import { api } from "~/utils/api";
import { RefreshCcw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DocumentCreateDialog } from "~/components/create-document-dialog"

const DocumentManagement: NextPage = () => {
  const { data: session } = useSession()
  const [rowSelection, setRowSelection] = React.useState({})
  const { data: documents, refetch } = api.document.getAll.useQuery(
    undefined,
    { enabled: session?.user !== undefined },
  );

  let data: DocumentColumn[] = []
  if (documents !== undefined) {
    data = documents.map((document) => {
      const d: DocumentColumn = {
        id: document.id,
        title: document.title,
        type: document.type,
        state: document.state,
        srcJson: document.srcJson?.toString(),
        dstJson: document.dstJson?.toString(),
        memo: document.memo,
        project: { id: document.project.id, name: document.project.name },
        user: (document.user !== null) ? {
          id: document.user.id,
          name: document.user.name !== null ? document.user.name : "",
          image: document.user.image !== null ? document.user.image : ""
        } : null,
        updated: document.updatedAt.toLocaleString()
      }

      return d
    })
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">All documents</h2>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {
              session?.user.role === "ADMIN" ?
                <DocumentCreateDialog />
                : <></>
            }
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      </div>
    </Layout>

  )
}

export default DocumentManagement
