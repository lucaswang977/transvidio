// {
// "html": "<html></html>",
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Save } from "lucide-react"
import {
  ComparativeHtmlEditor,
} from "~/components/ui/comparatives"

type PageSchema = {
  html: string,
}

const pageDefaultValue: PageSchema = {
  html: "",
}

type ArticleEditorProps = {
  docId: string,
  src: PageSchema,
  dst: PageSchema
}

const ArticleEditor = (props: ArticleEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  const onInputChange = (label: string, t: "src" | "dst", v: string) => {
    if (t === "src") {
      setEditorValues((values) => {
        return { ...values, src: { ...values.src, [label]: v } }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        return { ...values, dst: { ...values.dst, [label]: v } }
      })
    }
    setContentChanged(true)
  }

  function save() {
    mutation.mutate({
      documentId: props.docId,
      dst: JSON.stringify(editorValues.dst)
    })
    setContentChanged(false)
  }

  return (
    <div className="flex-col space-y-2">
      <Button className="fixed right-6 bottom-6 w-10 rounded-full p-0 z-20"
        disabled={!contentChanged} onClick={() => save()} >
        <Save className="h-4 w-4" />
        <span className="sr-only">Save</span>
      </Button>
      <ComparativeHtmlEditor
        label="html"
        src={editorValues.src.html}
        dst={editorValues.dst.html}
        onChange={onInputChange} />
    </div>
  )
}

const DocEditor: NextPage = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const { data: doc, status } = api.document.load.useQuery(
    { documentId: docId },
    { enabled: session?.user !== undefined }
  )
  let srcObj: PageSchema = doc?.srcJson as PageSchema
  if (srcObj === null) srcObj = pageDefaultValue
  let dstObj: PageSchema = doc?.dstJson as PageSchema
  if (dstObj === null) dstObj = pageDefaultValue

  return (
    status === "loading" ? <span>Loading</span> :
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {doc?.title ? doc.title : "Introduction Editor"}
          </h2>
          <p className="text-sm text-gray-400">saved at {doc?.updatedAt.toLocaleString()}</p>
        </div>
        <div className="flex items-center w-full justify-evenly space-y-2">
          <ArticleEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
