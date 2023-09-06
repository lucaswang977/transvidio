// {
//   videoUrl: "https://baseurl/bucketname/projectid/video/lectureid-assetid.mp4",
//   originalSubtitleUrl: "https://baseurl/bucketname/projectid/subtitle/lectureid-assetid.src.vtt",
//   subtitle: [
//     {
//       startTime: 123,11,
//       endTime: 125.56,
//       text: "wowowow",
//     },
//     ...
//   ],
//   ost: [
//     {
//       from: 11.22,
//       to: 22.33,
//       text: "On screen text",
//       attr: {
//         position: {x_percent: "0.2", y_percent: "0.2"}
//         size: 12,
//         style: bold,
//         color: white,
//       }
//     },
//     ...
//   ]
// }

import * as React from "react"
import { useRouter } from "next/router"

import { VideoPlayer } from "~/components/ui/video-player"
import type { VideoOstType } from "~/components/ui/video-player"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import type { SubtitleType, ProjectAiParamters, RelativePositionType, OnScreenTextItem } from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { timeFormat } from "~/utils/helper"
import type { NextPageWithLayout } from "~/pages/_app"
import type ReactPlayer from "react-player";
import { clone } from "ramda";
import type { AutofillHandler, EditorComponentProps } from "~/components/doc-editor";
import { DocumentEditor, handleTranslate, } from "~/components/doc-editor";
import { Button } from "~/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs"

const regexToSegementSentence = /[.!?)'"“”]+$/

const SubtitleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const reactPlayerRef = React.useRef<ReactPlayer>(null);
    const [captions, setCaptions] = React.useState({ src: "", dst: "" })
    const [ostIndexes, setOstIndexes] = React.useState<number[]>([])
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)

    React.useImperativeHandle(ref, () => {
      return { autofillHandler: handleAutoFill }
    }, [srcJson, dstJson])

    React.useEffect(() => {
      if (setAutoFillInit) setAutoFillInit(true)
    }, [])

    const defaultValue: SubtitleType = {
      videoUrl: "",
      subtitle: [],
    }

    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as SubtitleType
    if (dstJson) dstObj = dstJson as SubtitleType

    const handleAutoFill = async (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => {
      const aip: ProjectAiParamters = aiParams ? aiParams : {
        character: "",
        background: "",
        syllabus: ""
      }

      return new Promise<void>(async (resolve, reject) => {
        let sentences: string[] = []
        let i = 0
        for (const s of srcObj.subtitle) {
          const dst = dstObj.subtitle[i]
          // skip the translated sentences
          sentences.push(s.text)
          const sentence = sentences.join(" ")
          if (regexToSegementSentence.test(sentence.trim())) {
            if (!dst || dst.text.length === 0) {
              await handleTranslate(aip, sentence, (output) => {
                const _i = i
                handleChange("dst", o => {
                  const d = clone(o ? (o as SubtitleType) : defaultValue)
                  const t = d.subtitle[_i]
                  if (t) t.text = `${t.text}${output}`
                  else d.subtitle[_i] = { ...s, text: output }
                  return d
                })
              }, abortCtrl).catch(err => { reject(err) })
            }
            sentences = []
          }
          i = i + 1
        }
        resolve()
      })
    }

    const getWholeSentenceOnFocus = () => {
      let sentences: string[] = []
      let dstSentences: string[] = []
      let index = 0
      const result: { text: string, duration: number } = { text: "", duration: 0 }
      let focusedFound = false
      let duration = 0
      srcObj.subtitle.forEach(item => {
        sentences.push(item.text)

        const dstItem = dstObj.subtitle[index]
        if (dstItem) dstSentences.push(dstItem.text)

        const sentence = sentences.join(" ")
        duration = duration + item.to - item.from

        const dstSentence = dstSentences.join(" ")
        if (index === focusedIndex) focusedFound = true
        if (regexToSegementSentence.test(sentence.trim())) {
          sentences = []
          dstSentences = []
          if (focusedFound) {
            result.text = dstSentence
            result.duration = duration
            focusedFound = false
          }
          duration = 0
        }
        index = index + 1
      })
      return result
    }

    const [audioUrl, setAudioUrl] = React.useState<{ key: number, value: string } | null>(null)
    const synthesizeAudio = async (text: string) => {
      const apiUrl = `/api/synthesis?phrase=${encodeURIComponent(text)}`;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const audioBlob = await response.blob();
        const audioDataUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(d => {
          if (d) return { value: audioDataUrl, key: d.key + 1 }
          else return { value: audioDataUrl, key: 0 }
        });
      } catch (error) {
        console.error('Error fetching audio data:', error);
      }
    };
    let sentences: string[] = []
    let gray = false
    let turnColor = false
    const focusedSentence = getWholeSentenceOnFocus()
    const osts: VideoOstType[] = []
    const dstObjOst = dstObj.ost
    if (dstObjOst) {
      ostIndexes.forEach(k => {
        const ost = dstObjOst[k]
        if (ost) {
          osts.push({
            index: k,
            text: ost.text,
            attr: ost.attr
          })
        }
      })
    }

    const handleOstPosChanged = (index: number, position: RelativePositionType) => {
      handleChange("dst", o => {
        const d = clone(o ? (o as SubtitleType) : defaultValue)
        const ost = d.ost
        if (ost) {
          const t = ost[index]
          if (t) {
            t.attr.position = position
            return d
          }
        }
        return d
      })
    }

    const handleVideoProgress = (playedSeconds: number) => {
      const index = srcObj.subtitle.findIndex(
        (item) =>
          (playedSeconds * 1000 >= item.from) &&
          (playedSeconds * 1000 <= item.to))
      if (index >= 0) {
        const srcItem = srcObj.subtitle[index]
        const dstItem = dstObj.subtitle[index]
        setCaptions({
          src: srcItem?.text ? srcItem.text : "",
          dst: dstItem?.text ? dstItem.text : ""
        })
      } else if (captions.src.length !== 0 || captions.dst.length !== 0) {
        setCaptions({ src: "", dst: "" })
      }

      if (dstObj && dstObj.ost) {
        const osts: number[] = []
        let i = 0
        dstObj.ost.forEach(
          (item) => {
            if ((playedSeconds * 1000 >= item.from) &&
              (playedSeconds * 1000 <= item.to)) {
              osts.push(i)
            }
            i++
          })
        setOstIndexes(osts)
      }
    }

    return (
      <div className="pt-8 flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2">
        <div className="flex flex-col items-center space-y-2 mb-4 lg:order-last lg:mx-4">
          <VideoPlayer
            url={srcObj.videoUrl}
            ref={reactPlayerRef}
            caption={captions.dst}
            ost={osts}
            handleOstPosChanged={handleOstPosChanged}
            handleProgress={handleVideoProgress}
          >
          </VideoPlayer>
          <p className="hidden text-lg w-[500px] text-center">{captions.dst}</p>
          <p className="hidden text-sm w-[500px] text-center">{captions.src}</p>
          {
            <Button className="hidden text-sm" variant="outline" onClick={async () => {
              if (focusedSentence.text.length > 0) {
                await synthesizeAudio(focusedSentence.text)
              }
            }}>Synthesize</Button>
          }
          <p className="hidden">{focusedSentence.text}</p>
          <p className="hidden">{focusedSentence.duration} / unknown</p>
          {audioUrl &&
            <audio key={audioUrl.key} controls>
              <source src={audioUrl.value} type="audio/mpeg" />
            </audio>
          }
        </div>

        <Tabs defaultValue="subtitle">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subtitle">Subtitle</TabsTrigger>
            <TabsTrigger value="ost">On Screen Text</TabsTrigger>
          </TabsList>
          <TabsContent value="subtitle">
            <ScrollArea className="h-[60vh] lg:h-[90vh]">
              <div className="flex space-x-2 p-2">
                <div className="flex flex-col">
                  {
                    srcObj.subtitle.map((item, index) => {
                      if (turnColor) {
                        gray = !gray
                        turnColor = false
                      }
                      sentences.push(item.text)
                      const sentence = sentences.join(" ")
                      if (regexToSegementSentence.test(sentence.trim())) {
                        turnColor = true
                        sentences = []
                      }

                      const dstItem = dstObj.subtitle[index] ? dstObj.subtitle[index] : {
                        ...item,
                        text: ""
                      }

                      return (
                        <div key={`src-${index}`} className={`flex p-2 space-x-1 ${gray ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
                          <div className="flex flex-col text-slate-300">
                            <Label className="text-xs">{timeFormat(item.from)}</Label>
                            <Label className="text-xs">{timeFormat(item.to)}</Label>
                          </div>
                          <Textarea
                            disabled={!permission.srcWritable}
                            id={`src.items.${index}`}
                            value={item.text}
                            className="overflow-hidden w-72"
                            onChange={(event) => {
                              const subtitles = [...srcObj.subtitle]
                              const subtitle = subtitles[index]
                              if (subtitle) {
                                subtitle.text = event.target.value
                                handleChange("src", { ...srcObj, subtitle: subtitles })
                              }
                            }}
                            onFocus={() => {
                              if (reactPlayerRef.current) {
                                const duration = reactPlayerRef.current.getDuration()
                                reactPlayerRef.current.seekTo(item.from / 1000 / duration, "fraction")
                                setFocusedIndex(index)
                              }
                            }}
                          />
                          <Textarea
                            disabled={!permission.dstWritable}
                            id={`dst.items.${index}`}
                            value={dstItem?.text}
                            className="overflow-hidden w-72"
                            onChange={(event) => {
                              const subtitles = [...dstObj.subtitle]
                              const subtitle = subtitles[index]
                              if (subtitle) {
                                subtitle.text = event.target.value
                              } else {
                                subtitles[index] = {
                                  ...item,
                                  text: event.target.value
                                }
                              }
                              handleChange("dst", { ...dstObj, subtitle: subtitles })
                            }}
                            onFocus={() => {
                              if (reactPlayerRef.current) {
                                const duration = reactPlayerRef.current.getDuration()
                                reactPlayerRef.current.seekTo(item.from / 1000 / duration * 1.001, "fraction")
                                setFocusedIndex(index)
                              }
                            }}
                          />

                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ost">
            <ScrollArea className="h-[60vh] lg:h-[90vh]">
              <div className="flex flex-col space-y-2 p-2">
                {
                  dstObj.ost && dstObj.ost.map((ost, index) => {
                    return (
                      <div
                        key={`ost.${index}`}
                        className="flex"
                      >
                        <div className="flex flex-col space-y-2 px-2">
                          <Button
                            size="sm"
                            className="text-xs text-gray-300"
                            variant="ghost" onClick={() => {
                              handleChange("dst", o => {
                                const d = clone(o ? (o as SubtitleType) : defaultValue)
                                const ost = d.ost
                                if (ost) {
                                  const t = ost[index]
                                  if (t && reactPlayerRef.current) {
                                    t.from = reactPlayerRef.current.getCurrentTime() * 1000
                                    if (t.to - t.from < 100) t.to = t.from + 1000
                                    return d
                                  }
                                }
                                return d
                              })
                            }}>{timeFormat(ost.from)}</Button>
                          <Button
                            size="sm"
                            className="text-xs text-gray-300"
                            variant="ghost" onClick={() => {
                              handleChange("dst", o => {
                                const d = clone(o ? (o as SubtitleType) : defaultValue)
                                const ost = d.ost
                                if (ost) {
                                  const t = ost[index]
                                  if (t && reactPlayerRef.current) {
                                    t.to = reactPlayerRef.current.getCurrentTime() * 1000
                                    if (t.to - t.from < 100) t.to = t.from + 1000
                                    return d
                                  }
                                }
                                return d
                              })
                            }}>{timeFormat(ost.to)}</Button>
                        </div>
                        <Textarea
                          disabled={!permission.dstWritable}
                          value={ost.text}
                          className="overflow-hidden w-72"
                          onChange={(v) => {
                            handleChange("dst", o => {
                              const d = clone(o ? (o as SubtitleType) : defaultValue)
                              const ost = d.ost
                              if (ost) {
                                const t = ost[index]
                                if (t) {
                                  t.text = v.currentTarget.value
                                  return d
                                }
                              }
                              return d
                            })
                          }}
                          onFocus={() => {
                            if (reactPlayerRef.current) {
                              const duration = reactPlayerRef.current.getDuration()
                              reactPlayerRef.current.seekTo(ost.from / 1000 / duration * 1.001, "fraction")
                              setFocusedIndex(index)
                            }
                          }}
                        />
                        <div className="flex flex-col">

                        </div>
                      </div>
                    )
                  })
                }
                <Button
                  variant="outline"
                  onClick={() => {
                    handleChange("dst", o => {
                      const d = clone(o ? (o as SubtitleType) : defaultValue)
                      const osts = d.ost
                      if (reactPlayerRef.current) {
                        const from = reactPlayerRef.current.getCurrentTime() * 1000
                        const to = from + 1000
                        const o: OnScreenTextItem = {
                          from: from,
                          to: to,
                          text: "",
                          attr: {
                            position: { x_percent: 0.1, y_percent: 0.1 }
                          }
                        }
                        if (osts) {
                          osts.push(o)
                        } else {
                          d.ost = [o]
                        }
                      }
                      return d
                    })

                  }}>
                  New OST
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div >
    )
  })


SubtitleEditor.displayName = "SubtitleEditor"

const SubtitleEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson,
        handleChange,
        childrenRef,
        permission,
        _,
        setAutoFillInit) => {
        return <SubtitleEditor
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

SubtitleEditorPage.getTitle = () => "Document editor - Transvid.io"

export default SubtitleEditorPage
