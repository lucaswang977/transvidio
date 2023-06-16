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
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Save } from "lucide-react"
import type { Curriculum, CurriculumItem, SrcOrDst } from "~/types"
import { RichtextEditor } from "~/components/ui/richtext-editor";

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
  const onChangeSectionTitle = (index: number, v: string) => {
    const section = props.value.sections[index]
    if (section && section.title) section.title = v

    props.onChange(props.where, props.value)
  }

  const onChangeItemTitle = (i: number, j: number, v: string) => {
    const section = props.value.sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.title = v
    }

    props.onChange(props.where, props.value)
  }

  const onChangeItemDescription = (i: number, j: number, v: string) => {
    const section = props.value.sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.description = v
    }

    props.onChange(props.where, props.value)
  }


  return (
    <div className="w-[500px] space-y-2">
      {props.value.sections.map((section, i) => {
        return (
          <div key={`section${section.index}`} className="flex-col space-y-2">
            <div className="flex space-x-2 items-center">
              <Label htmlFor={`section${section.index}`} > Section</Label>
              <Input
                className="w-full"
                id={`section${section.index}`}
                value={section.title} onChange={(event) => {
                  onChangeSectionTitle(i, event.target.value)
                }} />
            </div>
            {
              section.items.map((item, j) => {
                return (
                  <div className="ml-10 flex-col space-y-1" key={`item${item.id}`}>
                    <div className="flex space-x-2 items-center" key={item.id}>
                      <Label htmlFor={`item${item.id}`}>{item.item_type}</Label>
                      <Input
                        id={`item${item.id}`}
                        value={item.title} onChange={(event) => {
                          onChangeItemTitle(i, j, event.target.value)
                        }} />
                    </div>

                    <RichtextEditor value={item.description} onChange={(event) => {
                      onChangeItemDescription(i, j, event.target.value)
                    }} />
                  </div>
                )
              })
            }
          </div>
        )
      })}
    </div >
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
      <div className="flex space-x-10">
        <CurriculumListEditor
          where="src"
          value={editorValues.src}
          onChange={onInputChange} />
        <CurriculumListEditor
          where="dst"
          value={editorValues.dst}
          onChange={onInputChange} />
      </div>
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
  if (!srcObj) srcObj = { sections: [] }
  let dstObj: Curriculum = doc?.dstJson as Curriculum
  if (!dstObj) dstObj = { sections: [] }

  srcObj.sections.forEach((section, i) => {
    if (dstObj.sections[i] === undefined) {
      const dstItems: CurriculumItem[] = []
      section.items.forEach((item, j) => {
        dstItems[j] = {
          id: item.id,
          title: "",
          description: "",
          item_type: item.item_type
        }
      })
      dstObj.sections[i] = {
        index: section.index,
        title: "",
        items: dstItems
      }
    } else {
      const dstItems: CurriculumItem[] = []
      section.items.forEach((item, j) => {
        if (dstItems[j] === undefined) {
          dstItems[j] = {
            id: item.id,
            title: "",
            description: "",
            item_type: item.item_type
          }
        }
      })
    }
  })

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
