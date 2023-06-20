// {
//   "count" : 2,
//   "result" : [
//    {
//      "id": 1232,
//      "correct_response": [ "c" ]
//      "prompt": {
//        "answers": [
//          "HTML",
//          "HTML",
//          ...
//        ],
//        "feedbacks": [
//          "",
//          "",
//        ],
//        "question": "HTML",
//      }
//    },
//    ...
//   ]
// }

import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import type { DocumentInfo, SrcOrDst, QuizType } from "~/types";
import { Label } from "~/components/ui/label";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import type { NextPageWithLayout } from "~/pages/_app";
import { clone } from "ramda"
import DocLayout from "~/components/doc-layout";

type QuizEditorProps = {
  srcObj: QuizType,
  dstObj: QuizType,
  onChange: (t: SrcOrDst, v: QuizType) => void
}

const QuizEditor = ({ srcObj, dstObj, onChange }: QuizEditorProps) => {
  return (
    <div className="flex-col space-y-2">
      {
        srcObj.results.map((q, i) => {
          return (
            <div key={`q${i}`} className="flex flex-col space-y-4">
              <Label className="bg-blue-100 p-2 font-bold">{`Question ${i + 1}`}</Label>
              <div className="flex space-x-2">
                <RichtextEditor
                  value={q.prompt.question}
                  onChange={(event) => {
                    const newObj = clone(srcObj)
                    const res = newObj.results[i]
                    if (res) res.prompt.question = event.target.value
                    onChange("src", newObj)
                  }}
                />
                <RichtextEditor
                  value={dstObj.results[i]?.prompt.question}
                  onChange={(event) => {
                    const newObj = clone(dstObj)
                    const res = newObj.results[i]
                    if (res) res.prompt.question = event.target.value
                    onChange("dst", newObj)
                  }}
                />
              </div>
              <Label className="font-bold">Answers: ({`right: ${q.correct_response.toString()}`})</Label>
              {
                q.prompt.answers.map((a, j) => {
                  return (
                    <div key={`a${j}`} className="flex space-x-2">
                      <Label>{String.fromCharCode("a".charCodeAt(0) + j)})</Label>
                      <RichtextEditor
                        value={a}
                        onChange={(event) => {
                          const newObj = clone(srcObj)
                          const res = newObj.results[i]
                          if (res) res.prompt.answers[j] = event.target.value
                          onChange("src", newObj)
                        }}
                      />
                      <RichtextEditor
                        value={dstObj.results[i]?.prompt.answers[j]}
                        onChange={(event) => {
                          const newObj = clone(dstObj)
                          const res = newObj.results[i]
                          if (res) res.prompt.answers[j] = event.target.value
                          onChange("dst", newObj)
                        }}
                      />
                    </div>
                  )
                })
              }
              <Label className="font-bold">Feedbacks: </Label>
              {
                q.prompt.feedbacks.map((f, j) => {
                  return (
                    <div key={`f${j}`} className="flex space-x-2">
                      <Label>{String.fromCharCode("a".charCodeAt(0) + j)})</Label>
                      <RichtextEditor
                        value={f}
                        onChange={(event) => {
                          const newObj = clone(srcObj)
                          const res = newObj.results[i]
                          if (res) res.prompt.feedbacks[j] = event.target.value
                          onChange("src", newObj)
                        }}
                      />
                      <RichtextEditor
                        value={dstObj.results[i]?.prompt.feedbacks[j]}
                        onChange={(event) => {
                          const newObj = clone(dstObj)
                          const res = newObj.results[i]
                          if (res) res.prompt.feedbacks[j] = event.target.value
                          onChange("dst", newObj)
                        }}
                      />
                    </div>
                  )
                })
              }
            </div>
          )
        })
      }
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
  const defaultQuizValue: QuizType = {
    count: 0,
    results: []
  }

  const [srcObj, setSrcObj] = React.useState(defaultQuizValue)
  const [dstObj, setDstObj] = React.useState(defaultQuizValue)

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

          if (doc.srcJson) setSrcObj(doc.srcJson as QuizType)
          if (doc.dstJson) setDstObj(doc.dstJson as QuizType)
          else setDstObj(doc.srcJson as QuizType)
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
          <QuizEditor srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
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
