// {
//   "sections" : [
//     {
//       "index": 1,
//       "title": "Before Starting the Course"
//       "items": [
//         {
//           "id": 1234,
//           "item_type": "lecture",
//           "title": "Course Overview",
//           "description": "HTML"
//         },
//         ...
//       ]
//     },
//     ...
//   ]
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Save } from "lucide-react"
import { Curriculum, SrcOrDst } from "~/types"

type CurriculumEditorProps = {
  docId: string,
  src: Curriculum,
  dst: Curriculum
}

type CurriculumListEditorProps = {
  where: SrcOrDst,
  value: Curriculum,
  onChange: (t: SrcOrDst, v: Curriculum) => void
}

const CurriculumListEditor = (props: CurriculumListEditorProps) => {
  const [value, setValue] = React.useState(props.value)
  const onChangeSectionTitle = (index: number, v: string) => {
    setValue((value) => {
      value.sections[index].title = v
      return value
    })
  }

  return (
    <div className="space-y-2">
      {value.sections.map((section, i) => {
        return (
          <Input key={section.index} value={section.title} onChange={(event) => {
            onChangeSectionTitle(i, event.target.value)
          }} />
        )
      })}
    </div>
  )
}

const CurriculumEditor = (props: CurriculumEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  const onInputChange = (t: SrcOrDst, v: Curriculum) => {
    if (t === "src") {
      setEditorValues((values) => {
        return { ...values, src: v }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        return { ...values, dst: v }
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
      <CurriculumListEditor
        where="src"
        value={editorValues.src}
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
  let srcObj: Curriculum = doc?.srcJson as Curriculum
  if (srcObj === null) srcObj = { sections: [] }
  let dstObj: Curriculum = doc?.dstJson as Curriculum
  if (dstObj === null) dstObj = { sections: [] }

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
          <CurriculumEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
