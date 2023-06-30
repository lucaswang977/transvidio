// {
// "html": "<html></html>",
// }

import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import type { NextPageWithLayout } from "~/pages/_app";
import type { ArticleType, DocumentInfo, ProjectAiParamters, SrcOrDst } from "~/types";
import DocLayout from "~/components/doc-layout";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { useToast } from "~/components/ui/use-toast";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { handleTranslate } from "~/pages/api/translate"

type ArticleEditorProps = {
  srcObj: ArticleType,
  dstObj: ArticleType,
  onChange: (t: SrcOrDst, v: ArticleType) => void
}

const ArticleEditor = ({ srcObj, dstObj, onChange }: ArticleEditorProps) => {
  const { innerHeight: height } = window
  return (
    <div className="flex space-x-4 w-full">
      <RichtextEditor
        height={`${height * 0.8}px`}
        value={srcObj.html}
        onChange={(event) => {
          const obj = { ...srcObj }
          obj.html = event.target.value
          onChange("src", obj)
        }} />
      <RichtextEditor
        height={`${height * 0.8}px`}
        value={dstObj.html}
        onChange={(event) => {
          const obj = { ...dstObj }
          obj.html = event.target.value
          onChange("dst", obj)
        }} />
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
  const defaultArticleValue: ArticleType = {
    html: "",
  }

  const [srcObj, setSrcObj] = React.useState(defaultArticleValue)
  const [dstObj, setDstObj] = React.useState(defaultArticleValue)

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

          if (doc.srcJson) setSrcObj(doc.srcJson as ArticleType)
          if (doc.dstJson) setDstObj(doc.dstJson as ArticleType)
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

      try {
        if (!dstObj.html || dstObj.html.length === 0) {
          const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
            chunkSize: 2000,
            chunkOverlap: 0
          })
          const splitted = await splitter.splitText(srcObj.html)
          for (const s of splitted) {
            await handleTranslate(aip, s, (output) => {
              setDstObj(o => { return { ...o, html: `${o.html}${output}` } })
              modified = true
            })
          }
          modified = true
        }
      } catch (error) {
        toast({ title: "Auto fill failed.", description: (error as { message: string }).message })
        resolve()
      } finally {
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
              {docInfo?.title ? docInfo.title : "Introduction Editor"}
            </h2>
          </div>
          <ArticleEditor srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
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
