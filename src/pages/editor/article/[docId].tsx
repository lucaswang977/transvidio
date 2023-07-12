// {
// "html": "<html></html>",
// }

import { useRouter } from "next/router"
import * as React from "react"

import type { NextPageWithLayout } from "~/pages/_app";
import type { ArticleType, ProjectAiParamters } from "~/types";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  type AutofillHandler,
  DocumentEditor,
  handleTranslate,
  type EditorComponentProps
} from "~/components/doc-editor";
import { clone } from "ramda";

const ArticleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {

    const defaultValue: ArticleType = {
      html: "",
    }
    React.useImperativeHandle(ref, () => {
      if (setAutoFillInit) setAutoFillInit(true)
      return { autofillHandler: handleAutoFill }
    }, [])


    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as ArticleType
    if (dstJson) dstObj = dstJson as ArticleType


    const handleAutoFill = async (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => {
      const aip: ProjectAiParamters = aiParams ? aiParams : {
        character: "",
        background: "",
        syllabus: ""
      }

      return new Promise<void>(async (resolve, reject) => {
        if (!dstObj.html || dstObj.html.length === 0) {
          const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
            chunkSize: 2000,
            chunkOverlap: 0
          })
          const splitted = await splitter.splitText(srcObj.html)
          for (const s of splitted) {
            await handleTranslate(aip, s, (output) => {
              handleChange("dst", o => {
                const d = clone(o ? (o as ArticleType) : defaultValue)
                return { ...d, html: `${d.html}${output}` }
              })
            }, abortCtrl).catch(err => { reject(err) })
          }
        }
        resolve()
      })
    }

    const { innerHeight: height } = window
    return (
      <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
        <RichtextEditor
          disabled={!permission.srcWritable}
          height={`${height * 0.8}px`}
          value={srcObj.html}
          onChange={(event) => {
            const obj = { ...srcObj }
            obj.html = event.target.value
            handleChange("src", obj)
          }} />
        <RichtextEditor
          disabled={!permission.dstWritable}
          height={`${height * 0.8}px`}
          value={dstObj.html}
          onChange={(event) => {
            const obj = { ...dstObj }
            obj.html = event.target.value
            handleChange("dst", obj)
          }} />
      </div>
    )
  })

ArticleEditor.displayName = "ArticleEditor"

const ArticleEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef, permission, _, setAutoFillInit) => {
        return <ArticleEditor
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

ArticleEditorPage.getTitle = () => "Document editor - Transvid.io"

export default ArticleEditorPage
