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
import { Input } from "~/components/ui/input"
import type { Curriculum, ProjectAiParamters } from "~/types"
import { RichtextEditor } from "~/components/ui/richtext-editor";
import type { NextPageWithLayout } from "~/pages/_app";
import {
  type AutofillHandler,
  DocumentEditor,
  type EditorComponentProps,
  handleTranslate,
} from "~/components/doc-editor";
import { clone } from "ramda";

const CurriculumEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const defaultValue: Curriculum = {
      sections: []
    }
    React.useImperativeHandle(ref, () => {
      if (setAutoFillInit) setAutoFillInit(true)
      return { autofillHandler: handleAutoFill }
    }, [])

    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as Curriculum
    if (dstJson) dstObj = dstJson as Curriculum

    const handleAutoFill = async (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => {
      const aip: ProjectAiParamters = aiParams ? aiParams : {
        character: "",
        background: "",
        syllabus: ""
      }

      return new Promise<void>(async (resolve, reject) => {
        let i = 0
        for (const section of srcObj.sections) {
          if (!dstObj.sections[i]) {
            dstObj.sections[i] = { ...section, title: "", items: [] }
          }
          const dstSection = dstObj.sections[i]

          // translate section title
          if (dstSection && dstSection.title.length === 0) {
            await handleTranslate(aip, section.title, (output) => {
              const _i = i
              handleChange("dst", o => {
                const obj = clone(o ? (o as Curriculum) : defaultValue)
                const t = obj.sections[_i]
                if (t) t.title = `${t.title}${output}`
                else obj.sections[_i] = { ...section, title: output }
                return obj
              })
            }, abortCtrl).catch(err => { reject(err) })
          }

          // translate section items
          if (dstSection) {
            let j = 0
            for (const item of section.items) {
              if (dstSection && !dstSection.items[j]) {
                dstSection.items[j] = { ...item, title: "", description: "" }
              }

              const t = dstSection.items[j]
              if (item.title && item.title.length > 0 && t && t.title.length === 0) {
                await handleTranslate(aip, item.title, (output) => {
                  const _i = i
                  const _j = j
                  handleChange("dst", o => {
                    const obj = clone(o ? (o as Curriculum) : defaultValue)
                    const q = obj.sections[_i]
                    if (q) {
                      const r = q.items[_j]
                      if (r) r.title = `${r.title}${output}`
                      else q.items[_j] = { ...item, title: output }
                    }
                    return { ...obj }
                  })
                }, abortCtrl).catch(err => { reject(err) })
              }
              if (item.description && item.description.length > 0 && t && t.description.length === 0) {
                await handleTranslate(aip, item.description, (output) => {
                  const _i = i
                  const _j = j
                  handleChange("dst", o => {
                    const obj = clone(o ? (o as Curriculum) : defaultValue)
                    const q = obj.sections[_i]
                    if (q) {
                      const r = q.items[_j]
                      if (r) r.description = `${r.description}${output}`
                      else q.items[_j] = { ...item, description: output }
                    }
                    return { ...obj }
                  })
                }, abortCtrl).catch(err => { reject(err) })
              }
              j = j + 1
            }
          }
          i = i + 1
        }
        resolve()
      })
    }
    return (
      <div className="w-full space-y-2">
        <div className="flex flex-col space-y-2">
          {srcObj.sections.map((section, i) => {
            if (!dstObj.sections[i]) {
              dstObj.sections[i] = {
                index: section.index,
                title: "",
                items: section.items.map(item => {
                  return { ...item, title: "", description: "" }
                })
              }
            }
            const dstSection = dstObj.sections[i]

            return (
              <div key={`section${section.index}`} className="flex-col space-y-2">
                <p className="font-bold">Section</p>
                <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                  <Input
                    disabled={!permission.srcWritable}
                    id={`src.section.${section.index}`}
                    className="w-full"
                    value={section.title} onChange={(event) => {
                      const section = srcObj.sections[i]
                      if (section) {
                        section.title = event.target.value
                        handleChange("src", { ...srcObj })
                      }
                    }} />
                  <Input
                    disabled={!permission.dstWritable}
                    id={`dst.section.${section.index}`}
                    className="w-full"
                    value={dstSection?.title} onChange={(event) => {
                      const section = dstSection
                      if (section) {
                        section.title = event.target.value
                        handleChange("dst", { ...dstObj })
                      }
                    }} />
                </div>
                <div className="ml-10 flex-col space-y-1" >
                  {
                    section.items.map((item, j) => {
                      return (
                        <div key={`section.item.${i}.${j}`} className="flex flex-col space-y-1">
                          <p className="font-bold">{item.item_type}</p>
                          <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                            <Input
                              disabled={!permission.srcWritable}
                              id={`src.section.item.${i}.${item.id}`}
                              value={item.title} onChange={(event) => {
                                const section = srcObj.sections[i]
                                if (section && section.items && section.items[j]) {
                                  const item = section.items[j]
                                  if (item) item.title = event.target.value
                                  handleChange("src", { ...srcObj })
                                }
                              }} />
                            <Input
                              disabled={!permission.dstWritable}
                              id={`dst.section.item.${i}.${item.id}`}
                              value={dstSection?.items[j]?.title} onChange={(event) => {
                                if (dstSection && dstSection.items) {
                                  const item = dstSection.items[j]
                                  if (item) item.title = event.target.value
                                  handleChange("dst", { ...dstObj })
                                }
                              }} />

                          </div>
                          <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                            <RichtextEditor
                              disabled={!permission.srcWritable}
                              height="150px"
                              value={item.description}
                              onChange={(event) => {
                                const section = srcObj.sections[i]
                                if (section && section.items && section.items[j]) {
                                  const item = section.items[j]
                                  if (item) item.description = event.target.value
                                  handleChange("src", { ...srcObj })
                                }
                              }} />
                            <RichtextEditor
                              disabled={!permission.dstWritable}
                              height="150px"
                              value={dstSection?.items[j]?.description}
                              onChange={(event) => {
                                if (dstSection && dstSection.items) {
                                  const item = dstSection.items[j]
                                  if (item) item.description = event.target.value
                                  handleChange("src", { ...srcObj })
                                }
                              }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )
          })}
        </div >
      </div>
    )
  })

CurriculumEditor.displayName = "CurriculumEditor"

const CurriculumEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef, permission, _, setAutoFillInit) => {
        return <CurriculumEditor
          srcJson={srcJson}
          dstJson={dstJson}
          handleChange={handleChange}
          permission={permission}
          ref={childrenRef}
          setAutoFillInit={setAutoFillInit}
        />
      }}
    </DocumentEditor >
  )
}

CurriculumEditorPage.getTitle = () => "Document editor - Transvid.io"

export default CurriculumEditorPage
