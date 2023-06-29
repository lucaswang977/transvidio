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
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import type { Introduction, SrcOrDst, DocumentInfo, ProjectAiParamters } from "~/types"
import DocLayout from "~/components/doc-layout";
import { Input } from "~/components/ui/input";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { ComparativeArrayEditor } from "~/components/comparative-array-input";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { fetchEventSource } from '@microsoft/fetch-event-source';

type IntroductionEditorProps = {
  srcObj: Introduction,
  dstObj: Introduction,
  onChange: (t: SrcOrDst, v: Introduction) => void
}

const IntroductionEditor = ({ srcObj, dstObj, onChange }: IntroductionEditorProps) => {
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
            onChange("src", obj)
          }} />
        <Input
          type="text"
          className="w-full"
          value={dstObj.title}
          onChange={(event) => {
            const obj = { ...dstObj }
            obj.title = event.target.value
            onChange("dst", obj)
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
            onChange("src", obj)
          }} />
        <Input
          type="text"
          value={dstObj.headline}
          onChange={(event) => {
            const obj = { ...dstObj }
            obj.headline = event.target.value
            onChange("dst", obj)
          }} />
      </div>
      <p className="text-sm font-bold">Description</p>
      <div className="flex space-x-2">
        <RichtextEditor
          height="500px"
          value={srcObj.description}
          onChange={(event) => {
            const obj = { ...srcObj }
            obj.description = event.target.value
            onChange("src", obj)
          }} />
        <RichtextEditor
          value={dstObj.description}
          height="500px"
          onChange={(event) => {
            const obj = { ...dstObj }
            obj.description = event.target.value
            onChange("dst", obj)
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
              onChange("src", obj)
            } else {
              const obj = { ...dstObj }
              obj.prerequisites = v
              onChange("dst", obj)
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
              onChange("src", obj)
            } else {
              const obj = { ...dstObj }
              obj.objectives = v
              onChange("dst", obj)
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
              onChange("src", obj)
            } else {
              const obj = { ...dstObj }
              obj.target_audiences = v
              onChange("dst", obj)
            }
          }} />
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
    { id: "", title: "", projectId: "", projectName: "", updatedAt: new Date(0) }
  )
  const defaultIntroductionValue: Introduction = {
    title: "",
    headline: "",
    description: "",
    prerequisites: [],
    objectives: [],
    target_audiences: []
  }
  const [srcObj, setSrcObj] = React.useState(defaultIntroductionValue)
  const [dstObj, setDstObj] = React.useState(defaultIntroductionValue)

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
            projectAiParamters: doc.project.aiParameter as ProjectAiParamters
          })

          if (doc.srcJson) setSrcObj(doc.srcJson as Introduction)
          if (doc.dstJson) setDstObj(doc.dstJson as Introduction)
        }
      }
    }
  )

  const handleChange = (t: SrcOrDst, v: Introduction) => {
    if (t === "src") setSrcObj(v)
    else setDstObj(v)

    setContentDirty(true)
  }

  const handleAutoFill = (projectId: string, aiParams?: ProjectAiParamters) => {
    const handleTranslate = async (text: string, callback: (output: string) => void) => {
      const reqBody = JSON.stringify({
        translate: text,
        character: aiParams?.character ? aiParams?.character : "",
        background: aiParams?.background ? aiParams?.background : "",
        syllabus: aiParams?.syllabus ? aiParams?.syllabus : "",
      })

      await fetchEventSource(`/api/translate`, {
        method: 'POST',
        body: reqBody,
        headers: { 'Content-Type': 'application/json' },
        onmessage(ev) {
          callback(ev.data)
        },
      });

    }
    return new Promise<void>(async resolve => {
      let modified = false

      if (dstObj.title.length === 0) {
        await handleTranslate(srcObj.title, (output) => {
          setDstObj(o => { return { ...o, title: `${o.title}${output}` } })
          modified = true
        })
      }

      if (dstObj.headline.length === 0) {
        await handleTranslate(srcObj.headline, (output) => {
          setDstObj(o => { return { ...o, headline: `${o.headline}${output}` } })
          modified = true
        })
      }

      if (dstObj.description.length === 0) {
        const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
          chunkSize: 2000,
          chunkOverlap: 0
        })
        const splitted = await splitter.splitText(srcObj.description)
        for (const s of splitted) {
          await handleTranslate(s, (output) => {
            setDstObj(o => { return { ...o, description: `${o.description}${output}` } })
            modified = true
          })
        }
        modified = true
      }

      // if (dstObj.prerequisites.length >= 0) {
      //   let i = 0
      //   for (const p of srcObj.prerequisites) {
      //     const value = dstObj.prerequisites[i]
      //     if (!value || value.length === 0) {
      //       const res = await autofill.mutateAsync({ projectId: projectId, text: p })
      //       const index = i
      //       setDstObj(o => {
      //         const np = [...o.prerequisites]
      //         np[index] = res
      //         return { ...o, prerequisites: np }
      //       })
      //       modified = true
      //     }
      //     i = i + 1
      //   }
      // }
      //
      // if (dstObj.objectives.length >= 0) {
      //   let i = 0
      //   for (const p of srcObj.objectives) {
      //     const value = dstObj.objectives[i]
      //     if (!value || value.length === 0) {
      //       const res = await autofill.mutateAsync({ projectId: projectId, text: p })
      //       const index = i
      //       setDstObj(o => {
      //         const np = [...o.objectives]
      //         np[index] = res
      //         return { ...o, objectives: np }
      //       })
      //       modified = true
      //     }
      //     i = i + 1
      //   }
      // }
      //
      // if (dstObj.target_audiences.length >= 0) {
      //   let i = 0
      //   for (const p of srcObj.target_audiences) {
      //     const value = dstObj.target_audiences[i]
      //     if (!value || value.length === 0) {
      //       const res = await autofill.mutateAsync({ projectId: projectId, text: p })
      //       const index = i
      //       setDstObj(o => {
      //         const np = [...o.target_audiences]
      //         np[index] = res
      //         return { ...o, target_audiences: np }
      //       })
      //       modified = true
      //     }
      //     i = i + 1
      //   }
      // }
      //
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
      handleAutoFill={handleAutoFill} >
      {status === "loading" ? <span>Loading</span> :
        <div className="flex flex-col items-center space-y-4 p-20">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight mx-auto">
              {docInfo?.title ? docInfo.title : "Introduction Editor"}
            </h2>
          </div>
          <IntroductionEditor srcObj={srcObj} dstObj={dstObj} onChange={handleChange} />
        </div>
      }
    </ DocLayout >
  )
}

DocEditorPage.getTitle = () => "Document editor - Transvid.io"

export default DocEditorPage
