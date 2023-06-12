// https://www.udemy.com/api-2.0/courses/673654/?fields[course]=
//   title,headline,description,prerequisites,objectives,target_audiences
// {
// "_class": "course",
// "id", 12345,
// "title": "text",
// "headeline": "text",
// "description": "HTML",
// "prerequisites": [text, text],
// "objectives": [text, text],
// "target_audiences": [text, text]
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Save } from "lucide-react"
import {
  ComparativeInput,
  ComparativeHtmlEditor,
  ComparativeArrayEditor
} from "~/components/ui/comparatives"

import { Introduction } from "~/types"

const pageDefaultValue: Introduction = {
  title: "",
  headline: "",
  description: "",
  prerequisites: [],
  objectives: [],
  target_audiences: []
}

type IntroductionEditorProps = {
  docId: string,
  src: Introduction,
  dst: Introduction
}

const IntroductionEditor = (props: IntroductionEditorProps) => {
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
      <ComparativeInput
        label="title"
        src={editorValues.src.title}
        dst={editorValues.dst.title}
        onChange={onInputChange} />
      <ComparativeInput
        label="headline"
        src={editorValues.src.headline}
        dst={editorValues.dst.headline}
        onChange={onInputChange} />
      <ComparativeHtmlEditor
        label="description"
        src={editorValues.src.description}
        dst={editorValues.dst.description}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="prerequisites"
        src={editorValues.src.prerequisites}
        dst={editorValues.dst.prerequisites}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="objectives"
        src={editorValues.src.objectives}
        dst={editorValues.dst.objectives}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="target_audiences"
        src={editorValues.src.target_audiences}
        dst={editorValues.dst.target_audiences}
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
  let srcObj = doc?.srcJson as Introduction
  if (srcObj === null) srcObj = pageDefaultValue
  let dstObj = doc?.dstJson as Introduction
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
          <IntroductionEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
