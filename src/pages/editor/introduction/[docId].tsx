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

import { type NextPageWithLayout } from "~/pages/_app"
import { useRouter } from "next/router"
import * as React from "react"

import type { Introduction, ProjectAiParamters } from "~/types"
import {
  DocumentEditor,
  handleTranslate,
  type AutofillHandler,
  type EditorComponentProps,
} from "~/components/doc-editor";
import { Input } from "~/components/ui/input";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { clone } from "ramda";

const IntroductionEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange }, ref) => {
    const defaultValue: Introduction = {
      title: "",
      headline: "",
      description: "",
      prerequisites: [],
      objectives: [],
      target_audiences: []
    }
    React.useImperativeHandle(ref, () => ({ autofillHandler: handleAutoFill }))

    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as Introduction
    if (dstJson) dstObj = dstJson as Introduction

    const handleAutoFill = async (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => {
      const aip: ProjectAiParamters = aiParams ? aiParams : {
        character: "",
        background: "",
        syllabus: ""
      }

      return new Promise<void>(async (resolve, reject) => {
        if (dstObj.title.length === 0) {
          await handleTranslate(aip, srcObj.title, (output) => {
            handleChange("dst", o => {
              const d = clone(o ? (o as Introduction) : defaultValue)
              return { ...d, title: `${d.title}${output}` }
            })
          }, abortCtrl).catch(err => { reject(err) })
        }

        if (dstObj.headline.length === 0) {
          await handleTranslate(aip, srcObj.headline, (output) => {
            handleChange("dst", o => {
              const d = clone(o ? (o as Introduction) : defaultValue)
              return { ...d, headline: `${d.headline}${output}` }
            })
          }, abortCtrl).catch(err => { reject(err) })
        }

        if (dstObj.description.length === 0) {
          const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
            chunkSize: 2000,
            chunkOverlap: 0
          })
          const splitted = await splitter.splitText(srcObj.description)
          for (const s of splitted) {
            await handleTranslate(aip, s, (output) => {
              handleChange("dst", o => {
                const d = clone(o ? (o as Introduction) : defaultValue)
                return { ...d, description: `${d.description}${output}` }
              })
            }, abortCtrl).catch(err => { reject(err) })
          }
        }

        if (srcObj.prerequisites.length >= 0) {
          let i = 0
          for (const p of srcObj.prerequisites) {
            const value = dstObj.prerequisites[i]
            if (!value || value.length === 0) {
              await handleTranslate(aip, p, (output) => {
                const _i = i
                handleChange("dst", o => {
                  const d = clone(o ? (o as Introduction) : defaultValue)
                  const np = [...d.prerequisites]
                  const c = np[_i]
                  if (c) np[_i] = `${c}${output}`
                  else np[_i] = output
                  return { ...d, prerequisites: np }
                })
              }, abortCtrl).catch(err => { reject(err) })
            }
            i = i + 1
          }
        }

        if (srcObj.objectives.length >= 0) {
          let i = 0
          for (const p of srcObj.objectives) {
            const value = dstObj.objectives[i]
            if (!value || value.length === 0) {
              await handleTranslate(aip, p, (output) => {
                const _i = i
                handleChange("dst", o => {
                  const d = clone(o ? (o as Introduction) : defaultValue)
                  const np = [...d.objectives]
                  const c = np[_i]
                  if (c) np[_i] = `${c}${output}`
                  else np[_i] = output
                  return { ...d, objectives: np }
                })
              }, abortCtrl).catch(err => { reject(err) })
            }
            i = i + 1
          }
        }

        if (srcObj.target_audiences.length >= 0) {
          let i = 0
          for (const p of srcObj.target_audiences) {
            const value = dstObj.target_audiences[i]
            if (!value || value.length === 0) {
              await handleTranslate(aip, p, (output) => {
                const _i = i
                handleChange("dst", o => {
                  const d = clone(o ? (o as Introduction) : defaultValue)
                  const np = [...d.target_audiences]
                  const c = np[_i]
                  if (c) np[_i] = `${c}${output}`
                  else np[_i] = output
                  return { ...d, target_audiences: np }
                })
              }, abortCtrl).catch(err => { reject(err) })
            }
            i = i + 1
          }
        }
        resolve()
      })
    }


    return (
      <div className="space-y-2 w-full">
        <p className="text-sm font-bold">Title</p>
        <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
          <Input
            id="src.title"
            type="text"
            value={srcObj.title}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.title = event.target.value
              handleChange("src", obj)
            }} />
          <Input
            id="dst.title"
            type="text"
            value={dstObj.title}
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.title = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Headline</p>
        <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
          <Input
            id="src.headline"
            type="text"
            value={srcObj.headline}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.headline = event.target.value
              handleChange("src", obj)
            }} />
          <Input
            id="dst.headline"
            type="text"
            value={dstObj.headline}
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.headline = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Description</p>
        <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
          <RichtextEditor
            id="src.description"
            height="500px"
            value={srcObj.description}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.description = event.target.value
              handleChange("src", obj)
            }} />
          <RichtextEditor
            id="dst.description"
            value={dstObj.description}
            height="500px"
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.description = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Prerequisites</p>
        <div className="flex flex-col space-y-2">
          {srcObj.prerequisites.map((src, index) => {
            const dst = dstObj.prerequisites[index]
            return (
              <div key={`pre-${index}`} className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                <Input
                  id={`src.prerequisites.${index}`}
                  type="text"
                  value={src ? src : ""}
                  onChange={(event) => {
                    const srcArray = srcObj.prerequisites
                    if (index < 0) srcArray.push(event.target.value)
                    else srcArray[index] = event.target.value
                    handleChange("src", { ...srcObj })
                  }} />
                <Input
                  id={`dst.prerequisites.${index}`}
                  type="text"
                  value={dst ? dst : ""}
                  onChange={(event) => {
                    const dstArray = dstObj.prerequisites
                    if (index < 0) dstArray.push(event.target.value)
                    else dstArray[index] = event.target.value
                    handleChange("dst", { ...dstObj })
                  }} />
              </div>)
          })}
        </div>
        <p className="text-sm font-bold">Objectives</p>
        <div className="flex flex-col space-y-2">
          {srcObj.objectives.map((src, index) => {
            const dst = dstObj.objectives[index]
            return (
              <div key={`ob-${index}`} className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                <Input
                  id={`src.objectives.${index}`}
                  type="text"
                  value={src ? src : ""}
                  onChange={(event) => {
                    const srcArray = srcObj.objectives
                    if (index < 0) srcArray.push(event.target.value)
                    else srcArray[index] = event.target.value
                    handleChange("src", { ...srcObj })
                  }} />
                <Input
                  id={`dst.objectives.${index}`}
                  type="text"
                  value={dst ? dst : ""}
                  onChange={(event) => {
                    const dstArray = dstObj.objectives
                    if (index < 0) dstArray.push(event.target.value)
                    else dstArray[index] = event.target.value
                    handleChange("dst", { ...dstObj })
                  }} />
              </div>)
          })}
        </div>
        <p className="text-sm font-bold">Target Audiences</p>
        <div className="flex flex-col space-y-2">
          {srcObj.target_audiences.map((src, index) => {
            const dst = dstObj.target_audiences[index]
            return (
              <div key={`ta-${index}`} className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                <Input
                  id={`src.target_audiences.${index}`}
                  type="text"
                  value={src ? src : ""}
                  onChange={(event) => {
                    const srcArray = srcObj.target_audiences
                    if (index < 0) srcArray.push(event.target.value)
                    else srcArray[index] = event.target.value
                    handleChange("src", { ...srcObj })
                  }} />
                <Input
                  id={`dst.target_audiences.${index}`}
                  type="text"
                  value={dst ? dst : ""}
                  onChange={(event) => {
                    const dstArray = dstObj.target_audiences
                    if (index < 0) dstArray.push(event.target.value)
                    else dstArray[index] = event.target.value
                    handleChange("dst", { ...dstObj })
                  }} />
              </div>)
          })}
        </div>
      </div>
    )
  })

IntroductionEditor.displayName = "IntroductionEditor"

const IntroductionEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef) => {
        return <IntroductionEditor
          srcJson={srcJson}
          dstJson={dstJson}
          handleChange={handleChange}
          ref={childrenRef}
        />
      }}
    </DocumentEditor >
  )
}

IntroductionEditorPage.getTitle = () => "Document editor - Transvid.io"

export default IntroductionEditorPage
