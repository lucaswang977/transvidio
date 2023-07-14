// {
//   "results" : [
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

import type { ProjectAiParamters, QuizItem, QuizType } from "~/types";
import { Label } from "~/components/ui/label";
import { RichtextEditor } from "~/components/ui/richtext-editor";
import type { NextPageWithLayout } from "~/pages/_app";
import { clone } from "ramda"
import {
  type AutofillHandler,
  DocumentEditor,
  handleTranslate,
  type EditorComponentProps
} from "~/components/doc-editor";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";

const QuizEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const defaultValue: QuizType = {
      results: []
    }

    React.useImperativeHandle(ref, () => {
      if (setAutoFillInit) setAutoFillInit(true)
      return { autofillHandler: handleAutoFill }
    }, [])


    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as QuizType
    if (dstJson) dstObj = dstJson as QuizType

    const handleAutoFill = async (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => {
      const aip: ProjectAiParamters = aiParams ? aiParams : {
        character: "",
        background: "",
        syllabus: ""
      }

      return new Promise<void>(async (resolve, reject) => {
        let i = 0
        for (const q of srcObj.results) {
          if (dstObj.results[i] === undefined) {
            dstObj.results[i] = {
              ...q, prompt: {
                question: "",
                answers: [],
                feedbacks: []
              }
            }
          }
          const dq = dstObj.results[i]

          // question
          if (dq && dq.prompt.question.length === 0) {
            await handleTranslate(aip, q.prompt.question, (output) => {
              const _i = i
              handleChange("dst", o => {
                const d = clone(o ? (o as QuizType) : defaultValue)
                const v = d.results[_i]?.prompt
                if (v) v.question = `${v.question}${output}`

                return d
              })
            }, abortCtrl).catch(err => { reject(err) })
          }

          // answers
          let j = 0
          for (const a of q.prompt.answers) {
            if (dq) {
              if (dq.prompt.answers[j] === undefined) {
                dq.prompt.answers[j] = ""
              }
              const p = dq.prompt.answers[j]
              if (p !== undefined && p.length === 0) {
                await handleTranslate(aip, a, (output) => {
                  const _i = i
                  const _j = j
                  handleChange("dst", o => {
                    const d = clone(o ? (o as QuizType) : defaultValue)
                    const v = d.results[_i]?.prompt.answers
                    if (v) {
                      const s = v[_j]
                      if (s) v[_j] = `${s}${output}`
                      else v[_j] = output
                    }

                    return d
                  })
                }, abortCtrl).catch(err => { reject(err) })
              }
            }
            j = j + 1
          }

          // feedbacks
          j = 0
          for (const f of q.prompt.feedbacks) {
            if (dq) {
              if (dq.prompt.feedbacks[j] === undefined) {
                dq.prompt.feedbacks[j] = ""
              }
              const p = dq.prompt.feedbacks[j]
              if (p !== undefined && p.length === 0) {
                await handleTranslate(aip, f, (output) => {
                  const _i = i
                  const _j = j
                  handleChange("dst", o => {
                    const d = clone(o ? (o as QuizType) : defaultValue)
                    const v = d.results[_i]?.prompt.feedbacks
                    if (v) {
                      const s = v[_j]
                      if (s) v[_j] = `${s}${output}`
                      else v[_j] = output
                    }

                    return d
                  })
                }, abortCtrl).catch(err => { reject(err) })
              }
            }
            j = j + 1
          }

          i = i + 1
        }
        resolve()
      })
    }

    const handleAddNewQuiz = () => {
      const newQuiz: QuizItem = {
        id: "",
        correct_response: [],
        prompt: {
          question: "",
          answers: [],
          feedbacks: []
        }
      }

      handleChange("src", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        if (d.results) d.results.push(newQuiz)
        else d.results = [newQuiz]

        return d
      })
      handleChange("dst", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        if (d.results) d.results.push(newQuiz)
        else d.results = [newQuiz]

        return d
      })
    }

    const handleAddNewAnswer = (index: number) => {
      handleChange("src", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) q.prompt.answers.push("")

        return d
      })
      handleChange("dst", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) q.prompt.answers.push("")

        return d
      })
    }

    const handleAddNewFeedback = (index: number) => {
      handleChange("src", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) q.prompt.feedbacks.push("")

        return d
      })
      handleChange("dst", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) q.prompt.feedbacks.push("")

        return d
      })
    }

    const handleSetCorrectAnswer = (index: number, label: string, value: boolean) => {
      handleChange("src", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) {
          q.correct_response = q.correct_response.filter(c => c !== label)
          if (value) q.correct_response.push(label)
        }

        return d
      })
      handleChange("dst", o => {
        const d = clone(o ? (o as QuizType) : defaultValue)
        const q = d.results[index]
        if (q) {
          q.correct_response = q.correct_response.filter(c => c !== label)
          if (value) q.correct_response.push(label)
        }

        return d
      })
    }

    return (
      <div className="p-8 w-full flex flex-col space-y-2">
        {
          srcObj.results.map((q, i) => {
            return (
              <div key={`q${i}`} className="flex flex-col space-y-4">
                <Label className="bg-blue-100 p-2 font-bold">{`Question ${i + 1}`}</Label>
                <div className="grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                  <RichtextEditor
                    disabled={!permission.srcWritable}
                    value={q.prompt.question}
                    onChange={(event) => {
                      const newObj = clone(srcObj)
                      const res = newObj.results[i]
                      if (res) res.prompt.question = event.target.value
                      handleChange("src", newObj)
                    }}
                  />
                  <RichtextEditor
                    disabled={!permission.dstWritable}
                    value={dstObj.results[i]?.prompt.question}
                    onChange={(event) => {
                      const newObj = clone(dstObj)
                      const res = newObj.results[i]
                      if (res) res.prompt.question = event.target.value
                      handleChange("dst", newObj)
                    }}
                  />
                </div>
                <Label className="font-bold">Answers: ({`right: ${q.correct_response.toString()}`})</Label>
                {
                  q.prompt.answers.map((a, j) => {
                    const l = String.fromCharCode("a".charCodeAt(0) + j)
                    return (
                      <div key={`a${j}`} className="flex space-x-2">
                        <Checkbox
                          disabled={!permission.srcWritable}
                          checked={q.correct_response.findIndex(k => k === l) >= 0}
                          onCheckedChange={(value) => { handleSetCorrectAnswer(i, l, value as boolean) }}
                        />
                        <Label>{l})</Label>
                        <div className="w-full grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                          <RichtextEditor
                            disabled={!permission.srcWritable}
                            value={a}
                            onChange={(event) => {
                              const newObj = clone(srcObj)
                              const res = newObj.results[i]
                              if (res) res.prompt.answers[j] = event.target.value
                              handleChange("src", newObj)
                            }}
                          />
                          <RichtextEditor
                            disabled={!permission.dstWritable}
                            value={dstObj.results[i]?.prompt.answers[j]}
                            onChange={(event) => {
                              const newObj = clone(dstObj)
                              const res = newObj.results[i]
                              if (res) res.prompt.answers[j] = event.target.value
                              handleChange("dst", newObj)
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                }
                <Button
                  disabled={!permission.srcWritable}
                  className="w-fit"
                  variant="outline"
                  onClick={() => handleAddNewAnswer(i)}>
                  Add a new answer
                </Button>
                <Label className="font-bold">Feedbacks: </Label>
                {
                  q.prompt.feedbacks.map((f, j) => {
                    return (
                      <div key={`f${j}`} className="flex space-x-2">
                        <Label>{String.fromCharCode("a".charCodeAt(0) + j)})</Label>
                        <div className="w-full grid grid-rows-2 space-y-1 md:space-y-0 md:grid-rows-1 md:space-x-2 md:grid-cols-2">
                          <RichtextEditor
                            disabled={!permission.srcWritable}
                            value={f}
                            onChange={(event) => {
                              const newObj = clone(srcObj)
                              const res = newObj.results[i]
                              if (res) res.prompt.feedbacks[j] = event.target.value
                              handleChange("src", newObj)
                            }}
                          />
                          <RichtextEditor
                            disabled={!permission.dstWritable}
                            value={dstObj.results[i]?.prompt.feedbacks[j]}
                            onChange={(event) => {
                              const newObj = clone(dstObj)
                              const res = newObj.results[i]
                              if (res) res.prompt.feedbacks[j] = event.target.value
                              handleChange("dst", newObj)
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                }
                <Button
                  disabled={!permission.srcWritable}
                  className="w-fit"
                  variant="outline"
                  onClick={() => handleAddNewFeedback(i)}>
                  Add a new feedback
                </Button>
              </div>
            )
          })
        }
        <Button
          disabled={!permission.srcWritable}
          className="w-fit"
          variant="outline"
          onClick={handleAddNewQuiz}>Add a new quiz</Button>
      </div>
    )
  })

QuizEditor.displayName = "QuizEditor"

const QuizEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef, permission, _, setAutoFillInit) => {
        return <QuizEditor
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

QuizEditorPage.getTitle = () => "Document editor - Transvid.io"

export default QuizEditorPage
