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
//   ]
// }

import * as React from "react"
import { useRouter } from "next/router"

import { VideoPlayer } from "~/components/ui/video-player"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import type { SubtitleType, ProjectAiParamters } from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { timeFormat } from "~/utils/helper"
import type { NextPageWithLayout } from "~/pages/_app"
import type ReactPlayer from "react-player";
import { clone } from "ramda";
import type { AutofillHandler, EditorComponentProps } from "~/components/doc-editor";
import { DocumentEditor, handleTranslate, } from "~/components/doc-editor";
import { Button } from "~/components/ui/button"

const SubtitleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const reactPlayerRef = React.useRef<ReactPlayer>(null);
    const [captions, setCaptions] = React.useState({ src: "", dst: "" })
    React.useImperativeHandle(ref, () => {
      return { autofillHandler: handleAutoFill }
    }, [srcJson, dstJson])

    React.useEffect(() => {
      if (setAutoFillInit) setAutoFillInit(true)
    }, [])

    const defaultValue: SubtitleType = {
      videoUrl: "",
      subtitle: []
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
        const regex = /[.,;!?)'"“”]+$/

        let sentences: string[] = []
        let i = 0
        for (const s of srcObj.subtitle) {
          const dst = dstObj.subtitle[i]
          // skip the translated sentences
          sentences.push(s.text)
          const sentence = sentences.join(" ")
          if (regex.test(sentence.trim())) {
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
    return (
      <div className="pt-8 flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2">
        <div className="flex flex-col items-center space-y-2 mb-4 lg:order-last lg:mx-4">
          <VideoPlayer
            url={srcObj.videoUrl}
            ref={reactPlayerRef}
            handleProgress={(playedSeconds: number) => {
              const index = srcObj.subtitle.findIndex(
                (item) =>
                  (playedSeconds * 1000 >= item.from) &&
                  (playedSeconds * 1000 <= item.to))
              if (index >= 0) {
                const srcItem = srcObj.subtitle[index]
                const dstItem = dstObj.subtitle[index]
                setCaptions({
                  src: srcItem?.text ? srcItem.text : "<empty>",
                  dst: dstItem?.text ? dstItem.text : "<empty>"
                })
              }
            }}
          >
          </VideoPlayer>
          <p className="text-lg w-[500px] text-center">{captions.dst}</p>
          <p className="text-sm w-[500px] text-center">{captions.src}</p>
          {audioUrl &&
            <audio key={audioUrl.key} controls>
              <source src={audioUrl.value} type="audio/mpeg" />
            </audio>
          }
        </div>

        <ScrollArea className="h-[60vh] lg:h-[90vh]">
          <div className="flex space-x-2 p-2">
            <div className="flex flex-col space-y-2">
              {
                srcObj.subtitle.map((item, index) => {
                  return (
                    <div key={`src-${index}`} className="flex space-x-1">
                      <div className="flex flex-col text-slate-300">
                        <Label className="text-xs">{timeFormat(item.from)}</Label>
                        <Button size="sm" className="text-xs" variant="link" onClick={async () => {
                          const subtitle = dstObj.subtitle[index]
                          if (subtitle) {
                            await synthesizeAudio(subtitle.text)
                          }
                        }}>Synthesize</Button>
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
                          }
                        }}
                      />
                    </div>
                  )
                })
              }
            </div>
            <div className="flex flex-col space-y-2">
              {
                srcObj.subtitle.map((item, index) => {
                  const dstItem = dstObj.subtitle[index] ? dstObj.subtitle[index] : {
                    ...item,
                    text: ""
                  }
                  return (
                    <div key={`dst-${index}`} className="flex space-x-1">
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
