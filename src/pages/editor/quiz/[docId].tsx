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

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Save } from "lucide-react"
import { type QuizType } from "~/types";
import { Label } from "~/components/ui/label";
import { RichtextEditor } from "~/components/ui/richtext-editor";

type QuizEditorProps = {
  docId: string,
  src: QuizType,
  dst: QuizType
}

const QuizEditor = (props: QuizEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)
  console.log(editorValues)

  const onInputChange = (t: "src" | "dst", v: QuizType) => {
    if (t === "src") {
      setEditorValues((values) => {
        return { ...values, src: v }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        return { ...values, dst: v }
      })
    }
    setContentChanged(true)
  }

  function save() {
    mutation.mutate({
      documentId: props.docId,
      src: JSON.stringify(editorValues.src),
      dst: JSON.stringify(editorValues.dst)
    })
    setContentChanged(false)
  }

  return (
    <div className="flex-col space-y-2">
      <Button className="fixed right-6 bottom-6 w-10 rounded-full p-0 z-20"
        disabled={!contentChanged} onClick={() => save()} >
        <Save className="h-4 w-4" />
        <span className="sr-only">Save</span>
      </Button>
      {
        editorValues.src.results.map((q, i) => {
          return (
            <div key={`q${i}`} className="flex flex-col space-y-4">
              <Label className="bg-blue-100 p-2 font-bold">{`Question ${i + 1}`}</Label>
              <div className="flex space-x-2">
                <RichtextEditor
                  value={q.prompt.question}
                  onChange={(event) => {
                    const newObj = { ...editorValues.src }
                    newObj.results[i]!.prompt.question = event.target.value
                    onInputChange("src", newObj)
                  }}
                />
                <RichtextEditor
                  value={editorValues.dst?.results[i]?.prompt.question}
                  onChange={(event) => {
                    const newObj = { ...editorValues.dst }
                    newObj.results[i]!.prompt.question = event.target.value
                    onInputChange("dst", newObj)
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
                          const newObj = { ...editorValues.src }
                          newObj.results[i]!.prompt.answers[j] = event.target.value
                          onInputChange("src", newObj)
                        }}
                      />
                      <RichtextEditor
                        value={editorValues.dst?.results[i]?.prompt.answers[j]}
                        onChange={(event) => {
                          const newObj = { ...editorValues.dst }
                          newObj.results[i]!.prompt.answers[j] = event.target.value
                          onInputChange("dst", newObj)
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
                          const newObj = { ...editorValues.src }
                          newObj.results[i]!.prompt.feedbacks[j] = event.target.value
                          onInputChange("src", newObj)
                        }}
                      />
                      <RichtextEditor
                        value={editorValues.dst?.results[i]?.prompt.feedbacks[j]}
                        onChange={(event) => {
                          const newObj = { ...editorValues.dst }
                          newObj.results[i]!.prompt.feedbacks[j] = event.target.value
                          onInputChange("dst", newObj)
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

const DocEditor: NextPage = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const { data: doc, status } = api.document.load.useQuery(
    { documentId: docId },
    { enabled: session?.user !== undefined }
  )
  const srcObj = doc?.srcJson as QuizType
  let dstObj = doc?.dstJson as QuizType

  if (srcObj && dstObj === null) {
    dstObj = JSON.parse(JSON.stringify(srcObj)) as QuizType
  }

  console.log("src: ", srcObj, typeof srcObj)
  console.log("dst: ", dstObj, typeof dstObj)

  return (
    status === "loading" ? <span>Loading</span> :
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {doc?.title ? doc.title : "Introduction Editor"}
          </h2>
          <p className="text-sm text-gray-400">saved at {doc?.updatedAt.toLocaleString()}</p>
        </div>
        <div className="flex items-center w-full justify-evenly space-y-2">
          <QuizEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
