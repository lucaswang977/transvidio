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
import type { Curriculum, DocumentInfo, ProjectAiParamters, SrcOrDst } from "~/types"
import { RichtextEditor } from "~/components/ui/richtext-editor";
import type { NextPageWithLayout } from "~/pages/_app";
import DocLayout from "~/components/doc-layout";
import { clone } from "ramda"
import { useToast } from "~/components/ui/use-toast";
import { handleTranslate } from "~/pages/api/translate"

type CurriculumListEditorProps = {
  value: Curriculum,
  onChange: (v: Curriculum) => void
}

const CurriculumListEditor = (props: CurriculumListEditorProps) => {
  const onChangeSectionTitle = (index: number, v: string) => {
    const sections = clone(props.value.sections)
    const section = sections[index]
    if (section && section.title) {
      section.title = v
      props.onChange({ sections: sections })
    }
  }

  const onChangeItemTitle = (i: number, j: number, v: string) => {
    const sections = clone(props.value.sections)
    const section = sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.title = v
      props.onChange({ sections: sections })
    }
  }

  const onChangeItemDescription = (i: number, j: number, v: string) => {
    const sections = clone(props.value.sections)
    const section = sections[i]
    if (section && section.items && section.items[j]) {
      const item = section.items[j]
      if (item) item.description = v
      props.onChange({ sections: sections })
    }
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

                    <RichtextEditor
                      height="150px"
                      value={item.description}
                      onChange={(event) => {
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
  const { toast } = useToast()
  const [contentDirty, setContentDirty] = React.useState(false)
  const [docInfo, setDocInfo] = React.useState<DocumentInfo>(
    { id: "", title: "", projectId: "", projectName: "", updatedAt: new Date(0) }
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
            projectId: doc.projectId,
            projectName: doc.project.name,
          })
          if (doc.srcJson) setSrcObj(doc.srcJson as Curriculum)
          if (doc.dstJson) {
            setDstObj(doc.dstJson as Curriculum)
          } else {
            if (dstObj === null || dstObj.sections.length === 0) {
              const obj: Curriculum = {
                sections: (doc.srcJson as Curriculum).sections.map(s => {
                  return {
                    ...s,
                    title: "",
                    items: s.items.map(i => {
                      return {
                        ...i,
                        title: "",
                        description: ""
                      }
                    })
                  }
                })
              }
              setDstObj(obj)
            }
          }
        }
      }
    }
  )

  const handleAutoFill = (aiParams?: ProjectAiParamters) => {
    let aip: ProjectAiParamters = {
      character: "",
      background: "",
      syllabus: ""
    }

    if (aiParams) {
      aip = { ...aiParams }
    }

    return new Promise<void>(async resolve => {
      let modified = false
      const obj = clone(dstObj)

      let i = 0
      for (const section of srcObj.sections) {
        const s = obj.sections[i]
        try {
          console.log(s)
          if (s) {
            // translate section title
            if (s.title.length === 0) {
              await handleTranslate(aip, section.title, (output) => {
                setDstObj(o => {
                  const obj = clone(o)
                  const t = obj.sections[i]
                  if (t) t.title = `${t.title}${output}`
                  else obj.sections[i] = { ...section, title: output }
                  return obj
                })
                modified = true
              })
            }

            // translate section items
            let j = 0
            for (const item of section.items) {
              if (!s.items[j]) {
                s.items[j] = { ...item, title: "", description: "" }
              }

              const t = s.items[j]
              if (item.title && item.title.length > 0 && t && t.title.length === 0) {
                await handleTranslate(aip, item.title, (output) => {
                  setDstObj(o => {
                    const obj = clone(o)
                    const q = obj.sections[i]
                    if (q) {
                      const r = q.items[j]
                      if (r) r.title = `${r.title}${output}`
                      else q.items[j] = { ...item, title: output }
                    }
                    return obj
                  })
                  modified = true
                })
              }
              if (item.description && item.description.length > 0 && t?.description.length === 0) {
                await handleTranslate(aip, item.description, (output) => {
                  setDstObj(o => {
                    const obj = clone(o)
                    const q = obj.sections[i]
                    if (q) {
                      const r = q.items[j]
                      if (r) r.description = `${r.description}${output}`
                      else q.items[j] = { ...item, description: output }
                    }
                    return obj
                  })
                  modified = true
                })
              }
              j = j + 1
            }
          } else {
            console.log("should not be existed", i)
          }
        } catch (error) {
          toast({ title: "Auto fill failed.", description: (error as { message: string }).message })
          resolve()
          break
        } finally {
        }

        i = i + 1
      }

      if (modified) setContentDirty(modified)
      resolve()
    })
  }

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
      handleAutoFill={handleAutoFill}
    >
      {status === "loading" ? <span>Loading</span> :
        <div className="flex flex-col items-center space-y-4 p-20">
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
