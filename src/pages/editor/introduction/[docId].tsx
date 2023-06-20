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

import type { Introduction, SrcOrDst, DocumentInfo } from "~/types"
import DocLayout from "~/components/doc-layout";
import { Input } from "~/components/ui/input";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { ComparativeArrayEditor } from "~/components/comparative-array-input";

type IntroductionEditorProps = {
  srcObj: Introduction,
  dstObj: Introduction,
  onChange: (t: SrcOrDst, v: Introduction) => void
}

const IntroductionEditor = ({ srcObj, dstObj, onChange }: IntroductionEditorProps) => {
  return (
    <div className="flex-1 items-center space-y-2 justify-center">
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Title</p>
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
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Headline</p>
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
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Description</p>
        <RichtextEditor
          value={srcObj.description}
          onChange={(event) => {
            const obj = { ...srcObj }
            obj.description = event.target.value
            onChange("src", obj)
          }} />
        <RichtextEditor
          value={dstObj.description}
          onChange={(event) => {
            const obj = { ...dstObj }
            obj.description = event.target.value
            onChange("dst", obj)
          }} />
      </div>
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Prerequisites</p>
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
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Objectives</p>
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
      <div className="flex flex-col space-y-2 items-center">
        <p className="text-sm font-bold">Target Audiences</p>
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
    { id: "", title: "", projectName: "", updatedAt: new Date(0) }
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
            projectName: doc.project.name,
          })

          setSrcObj(doc.srcJson as Introduction)
          setDstObj(doc.dstJson as Introduction)
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
        <div className="flex flex-col items-center space-y-4 p-20">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight mx-auto">
              {docInfo?.title ? docInfo.title : "Introduction Editor"}
            </h2>
          </div>
          <IntroductionEditor srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
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
