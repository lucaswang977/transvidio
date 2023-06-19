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

import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import type { Curriculum, DocumentInfo, SrcOrDst } from "~/types"
import { RichtextEditor } from "~/components/ui/richtext-editor";
import type { NextPageWithLayout } from "~/pages/_app";
import DocLayout from "../layout";

type CurriculumListEditorProps = {
  value: Curriculum,
  onChange: (v: Curriculum) => void
}

const CurriculumListEditor = (props: CurriculumListEditorProps) => {
  const onChangeSectionTitle = (index: number, v: string) => {
    const section = props.value.sections[index]
    if (section && section.title) section.title = v

    props.onChange(props.value)
  }

  const onChangeItemTitle = (i: number, j: number, v: string) => {
    const section = props.value.sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.title = v
    }

    props.onChange(props.value)
  }

  const onChangeItemDescription = (i: number, j: number, v: string) => {
    const section = props.value.sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.description = v
    }

    props.onChange(props.value)
  }

  console.log("value", props.value)

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

type CurriculumEditorProps = {
  srcObj: Curriculum,
  dstObj: Curriculum
  onChange: (t: SrcOrDst, v: Curriculum) => void
}

const CurriculumEditor = ({ srcObj, dstObj, onChange }: CurriculumEditorProps) => {
  console.log(srcObj, dstObj)

  return (
    <div className="flex-col space-y-2">
      <div className="flex space-x-10">
        <CurriculumListEditor
          value={srcObj}
          onChange={(v) => onChange("src", v)} />
        <CurriculumListEditor
          value={dstObj}
          onChange={(v) => onChange("dst", v)} />
      </div>
    </div>
  )
}

const DocEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const mutation = api.document.save.useMutation()
  const [contentDirty, setContentDirty] = React.useState(false)
  const [docInfo, setDocInfo] = React.useState<DocumentInfo>(
    { id: "", title: "", projectName: "", updatedAt: new Date(0) }
  )
  const defaultCurriculumValue: Curriculum = {
    sections: []
  }
  const [srcObj, setSrcObj] = React.useState(defaultCurriculumValue)
  const [dstObj, setDstObj] = React.useState(defaultCurriculumValue)

  const { status } = api.document.load.useQuery(
    { documentId: docId },
    {
      enabled: (session?.user !== undefined && docId !== undefined && docInfo.id === ""),
      onSuccess: (doc) => {
        if (doc) {
          setDocInfo({
            id: doc.id,
            title: doc.title,
            updatedAt: doc.updatedAt,
            projectName: doc.project.name,
          })
          if (doc.srcJson) setSrcObj(doc.srcJson as Curriculum)
          if (doc.dstJson) {
            setDstObj(doc.dstJson as Curriculum)
          } else if (doc.srcJson) {
            setDstObj(doc.srcJson as Curriculum)
          }
        }
      }
    }
  )

  function saveDoc() {
    mutation.mutate({
      documentId: docId,
      src: JSON.stringify(srcObj),
      dst: JSON.stringify(dstObj)
    }, {
      onSuccess: (di) => {
        setDocInfo(di)
      }
    })
    setContentDirty(false)
  }

  return (
    <DocLayout
      docInfo={docInfo}
      handleSave={saveDoc}
      saveDisabled={!contentDirty}
    >
      {status === "loading" ? <span>Loading</span> :
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight mx-auto">
              {docInfo?.title ? docInfo.title : "Curriculum Editor"}
            </h2>
          </div>
          <CurriculumEditor srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
            if (t === "src") setSrcObj(v)
            else setDstObj(v)
            setContentDirty(true)
          }} />
        </div>
      }
    </DocLayout>
  )
}

DocEditorPage.getTitle = () => "Document editor - Transvid.io"

export default DocEditorPage
