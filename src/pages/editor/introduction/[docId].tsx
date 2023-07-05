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
  type HandleChangeInterface
} from "~/components/doc-editor";
import { Input } from "~/components/ui/input";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { ComparativeArrayEditor } from "~/components/comparative-array-input";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Prisma } from "@prisma/client";

type IntroductionEditorProps = {
  srcJson: Prisma.JsonValue | undefined,
  dstJson: Prisma.JsonValue | undefined,
  handleChange: HandleChangeInterface
}

const IntroductionEditor = React.forwardRef<AutofillHandler | null, IntroductionEditorProps>(
  ({ srcJson, dstJson, handleChange }, ref) => {
    const defaultIntroductionValue: Introduction = {
      title: "",
      headline: "",
      description: "",
      prerequisites: [],
      objectives: [],
      target_audiences: []
    }
    React.useImperativeHandle(ref, () => ({ autofillHandler: handleAutoFill }))

    let srcObj = defaultIntroductionValue
    let dstObj = defaultIntroductionValue
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
              const d = o ? (o as Introduction) : defaultIntroductionValue
              return { ...d, title: `${d.title}${output}` }
            })
          }, abortCtrl).catch(err => { reject(err) })
        }

        if (dstObj.headline.length === 0) {
          await handleTranslate(aip, srcObj.headline, (output) => {
            handleChange("dst", o => {
              const d = o ? (o as Introduction) : defaultIntroductionValue
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
                const d = o ? (o as Introduction) : defaultIntroductionValue
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
                const index = i
                handleChange("dst", o => {
                  const d = o ? (o as Introduction) : defaultIntroductionValue
                  const np = [...d.prerequisites]
                  const c = np[index]
                  if (c) np[index] = `${c}${output}`
                  else np[index] = output
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
                const index = i
                handleChange("dst", o => {
                  const d = o ? (o as Introduction) : defaultIntroductionValue
                  const np = [...d.objectives]
                  const c = np[index]
                  if (c) np[index] = `${c}${output}`
                  else np[index] = output
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
                const index = i
                handleChange("dst", o => {
                  const d = o ? (o as Introduction) : defaultIntroductionValue
                  const np = [...d.target_audiences]
                  const c = np[index]
                  if (c) np[index] = `${c}${output}`
                  else np[index] = output
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
      <div className="flex-1 items-center space-y-2 justify-center">
        <p className="text-sm font-bold">Title</p>
        <div className="flex space-x-2">
          <Input
            type="text"
            className="w-full"
            value={srcObj.title}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.title = event.target.value
              handleChange("src", obj)
            }} />
          <Input
            type="text"
            className="w-full"
            value={dstObj.title}
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.title = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Headline</p>
        <div className="flex space-x-2">
          <Input
            type="text"
            value={srcObj.headline}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.headline = event.target.value
              handleChange("src", obj)
            }} />
          <Input
            type="text"
            value={dstObj.headline}
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.headline = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Description</p>
        <div className="flex space-x-2">
          <RichtextEditor
            height="500px"
            width="600px"
            value={srcObj.description}
            onChange={(event) => {
              const obj = { ...srcObj }
              obj.description = event.target.value
              handleChange("src", obj)
            }} />
          <RichtextEditor
            value={dstObj.description}
            height="500px"
            width="600px"
            onChange={(event) => {
              const obj = { ...dstObj }
              obj.description = event.target.value
              handleChange("dst", obj)
            }} />
        </div>
        <p className="text-sm font-bold">Prerequisites</p>
        <div className="flex flex-col space-y-2">
          <ComparativeArrayEditor
            src={srcObj.prerequisites}
            dst={dstObj.prerequisites}
            onChange={(t, v) => {
              if (t === "src") {
                const obj = { ...srcObj }
                obj.prerequisites = v
                handleChange("src", obj)
              } else {
                const obj = { ...dstObj }
                obj.prerequisites = v
                handleChange("dst", obj)
              }
            }} />
        </div>
        <p className="text-sm font-bold">Objectives</p>
        <div className="flex flex-col space-y-2">
          <ComparativeArrayEditor
            src={srcObj.objectives}
            dst={dstObj.objectives}
            onChange={(t, v) => {
              if (t === "src") {
                const obj = { ...srcObj }
                obj.objectives = v
                handleChange("src", obj)
              } else {
                const obj = { ...dstObj }
                obj.objectives = v
                handleChange("dst", obj)
              }
            }} />
        </div>
        <p className="text-sm font-bold">Target Audiences</p>
        <div className="flex flex-col space-y-2 items-center">
          <ComparativeArrayEditor
            src={srcObj.target_audiences}
            dst={dstObj.target_audiences}
            onChange={(t, v) => {
              if (t === "src") {
                const obj = { ...srcObj }
                obj.target_audiences = v
                handleChange("src", obj)
              } else {
                const obj = { ...dstObj }
                obj.target_audiences = v
                handleChange("dst", obj)
              }
            }} />
        </div>
      </div>
    )
  })

IntroductionEditor.displayName = "IntroductionEditor"

const DocEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef) => {
        return <IntroductionEditor
          srcJson={srcJson as Introduction}
          dstJson={dstJson as Introduction}
          handleChange={handleChange}
          ref={childrenRef}
        />
      }}
    </DocumentEditor >
  )
}

DocEditorPage.getTitle = () => "Document editor - Transvid.io"

export default DocEditorPage
