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
import type { SubtitleType, ProjectAiParamters, AudioSynthesisType } from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { timeFormat } from "~/utils/helper"
import type { NextPageWithLayout } from "~/pages/_app"
import type ReactPlayer from "react-player";
import { clone } from "ramda";
import type { AutofillHandler, EditorComponentProps } from "~/components/doc-editor";
import { DocumentEditor, handleTranslate, } from "~/components/doc-editor";
import { Button } from "~/components/ui/button"
import { PlayCircle } from "lucide-react"

const regexToSegementSentence = /[.!?)'"“”]+$/

const SubtitleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const reactPlayerRef = React.useRef<ReactPlayer>(null);
    const [captions, setCaptions] = React.useState({ src: "", dst: "" })
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const [currentItemIndex, setCurrentItemIndex] = React.useState(0)
    const [currentAudioPlayPosition, setCurrentAudioPlayPostision] = React.useState(0)
    const [isSynthAudioPlaying, setIsSynthAudioPlaying] = React.useState(false)
    const audioRef = React.useRef(null);
    const singleAudioRef = React.useRef(null);

    React.useImperativeHandle(ref, () => {
      return { autofillHandler: handleAutoFill }
    }, [srcJson, dstJson])

    React.useEffect(() => {
      if (setAutoFillInit) setAutoFillInit(true)
    }, [])

    const defaultValue: SubtitleType = {
      videoUrl: "",
      subtitle: [],
      audio: []
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

    React.useEffect(() => {
      if (dstObj && dstObj.subtitle) {
        const emptyAudioSynthesisData: AudioSynthesisType = {
          subtitleItemIds: [],
          from: 0,
          to: 0,
          text: "",
          textDuration: 0,
          audioSynced: false,
          audioData: "",
          audioDuration: 0,
        }
        const result: AudioSynthesisType[] = []
        let srcSentences: string[] = []
        let dstSentences: string[] = []
        let subtitleItemIds: number[] = []
        let index = 0
        let data = emptyAudioSynthesisData

        srcObj.subtitle.forEach(item => {
          if (srcSentences.length === 0) {
            data.from = item.from
          }
          srcSentences.push(item.text)

          const dstItem = dstObj.subtitle[index]
          if (dstItem) {
            dstSentences.push(dstItem.text)
            subtitleItemIds.push(index)
          }

          if (regexToSegementSentence.test(srcSentences.join(" ").trim())) {
            data.text = dstSentences.join("")
            data.subtitleItemIds = [...subtitleItemIds]
            data.to = item.to
            data.textDuration = data.to - data.from
            srcSentences = []
            dstSentences = []
            subtitleItemIds = []
            result.push({ ...data })
            data = emptyAudioSynthesisData
          }
          index = index + 1
        })

        handleChange("dst", dstObj => {
          const origData = (dstObj as SubtitleType).audio
          result.forEach(item => {
            const origItem = origData.find(i => i.from === item.from && i.to === item.to)
            if (origItem && origItem.audioSynced && origItem.text === item.text) {
              item.audioSynced = true
              item.audioData = origItem.audioData
              item.audioDuration = origItem.audioDuration
            } else {
              item.audioSynced = false
            }
          })

          return { ...(dstObj as SubtitleType), audio: result }
        })
      }
    }, [dstObj])

    const playAudio = async () => {
      if (audioRef.current) {
        const audioElement = audioRef.current as HTMLAudioElement

        const currentAudioData = audioData[currentItemIndex]
        const currentAudioUrl = currentAudioData?.audioData
        let pauseDuration = currentAudioData ? currentAudioData.from - currentAudioPlayPosition : 0
        if (pauseDuration < 0) pauseDuration = 0
        console.log("audio:", currentItemIndex, currentAudioPlayPosition, currentAudioData?.from, pauseDuration)

        await new Promise(resolve => setTimeout(resolve, pauseDuration));

        console.log("play audio")
        if (currentAudioUrl) {
          audioElement.src = currentAudioUrl
          await audioElement.play();
        }

        if (currentItemIndex < audioData.length) {
          setCurrentItemIndex(currentItemIndex + 1);
          setCurrentAudioPlayPostision(v => {
            if (currentAudioData)
              return v + currentAudioData.audioDuration + pauseDuration
            else
              return v + pauseDuration
          })
        } else {
          (audioRef.current as HTMLAudioElement).pause()
          setCurrentItemIndex(0)
          setCurrentAudioPlayPostision(0)
          setIsSynthAudioPlaying(false)
        }
      }
    }

    const synthesizeAudio = async () => {
      const newAudioData = clone(audioData)
      for (const data of newAudioData) {
        if (!data.audioSynced) {
          const text = data.text
          if (text.length > 0) {
            const apiUrl = `/api/synthesis?phrase=${encodeURIComponent(text)}`;
            try {
              const response = await fetch(apiUrl);
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              const durationStr = response.headers.get("Audio-Duration")
              data.audioDuration = Math.floor(parseFloat(durationStr ? durationStr : "0") * 1000)
              const audioBlob = await response.blob();
              data.audioData = URL.createObjectURL(audioBlob);
              data.audioSynced = true
              console.log("audio synthesized: ", data)
            } catch (error) {
              console.error('Error fetching audio data:', error);
            }
          }
          handleChange("dst", { ...dstObj, audio: newAudioData })
        }
      }
    };
    let sentences: string[] = []
    let gray = false
    let turnColor = false

    const audioData = dstObj.audio

    const getAudioDataByIndex = (index: number | null) => {
      if (audioData)
        return audioData.findIndex(item => {
          if (index !== null && item.subtitleItemIds.includes(index)) {
            return item
          }
        })
      else return -1
    }

    const isGoogdAudioState = (audioData: AudioSynthesisType | undefined) => {
      return (audioData &&
        audioData.textDuration > 0 &&
        audioData.audioDuration > 0 &&
        Math.abs(audioData.audioDuration - audioData.textDuration) <= 500)
    }

    const focusedAudioData = audioData ? audioData[getAudioDataByIndex(focusedIndex)] : undefined

    return (
      <div className="pt-8 flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2">
        <div className="flex flex-col items-center space-y-2 mb-4 lg:order-last lg:mx-4">
          <VideoPlayer
            url={srcObj.videoUrl}
            ref={reactPlayerRef}
            muted={isSynthAudioPlaying}
            playing={isSynthAudioPlaying}
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
                setFocusedIndex(index)
              }
            }}
          >
          </VideoPlayer>
          <p className="text-lg w-[500px] text-center">{captions.dst}</p>
          <p className="text-sm w-[500px] text-center">{captions.src}</p>
          {
            <Button className="text-sm" variant="outline" onClick={async () => {
              if (!isSynthAudioPlaying) {
                if (reactPlayerRef.current) reactPlayerRef.current.seekTo(0)
                setIsSynthAudioPlaying(true);
                await playAudio();
              } else {
                setIsSynthAudioPlaying(false);
                setCurrentItemIndex(0)
                setCurrentAudioPlayPostision(0)
                if (audioRef.current) {
                  (audioRef.current as HTMLAudioElement).pause()
                }
              }
            }}>{!isSynthAudioPlaying ? "Play from beginning" : "Stop"}</Button>
          }
          <audio className="hidden" ref={audioRef} onEnded={playAudio} />
        </div>

        <ScrollArea className="h-[60vh] lg:h-[90vh]">
          <div className="flex space-x-2 p-2">
            <div className="flex flex-col">
              {
                srcObj.subtitle.map((item, index) => {
                  if (dstObj && dstObj.subtitle && dstObj.subtitle[index]) {
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

                    const audioDataIndex = getAudioDataByIndex(index)
                    const auData = audioData[audioDataIndex]
                    const goodState = isGoogdAudioState(auData)
                    const diffCharacters = auData ?
                      Math.floor(((auData.textDuration > 0 ? auData.textDuration : 0) -
                        (auData.audioDuration > 0 ? auData.audioDuration : 0))
                        / auData.textDuration * auData.text.length)
                      : 0

                    return (
                      <div
                        key={`src-${index}`}
                        className={`flex p-2 space-x-1 ${focusedIndex === index ? "border-red-100 border-2 rounded" : ""} ${gray ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
                        <div className="flex flex-col justify-between items-end pr-1">
                          <div className="flex flex-col space-y-1">
                            <Label className="text-xs text-slate-300">{timeFormat(item.from)}</Label>
                            <Label className="text-xs text-slate-300">{timeFormat(item.to)}</Label>
                          </div>
                          {
                            auData && auData.audioDuration > 0 ?
                              <div className="flex space-x-1 items-center">
                                {
                                  (focusedIndex === index && focusedAudioData && focusedAudioData.audioData.length > 0) &&
                                  <>
                                    <audio ref={singleAudioRef} className="hidden" key={focusedAudioData.from} controls>
                                      <source src={focusedAudioData.audioData} type="audio/mpeg" />
                                    </audio>
                                    <PlayCircle onClick={async () => {
                                      if (singleAudioRef.current) {
                                        const ref = singleAudioRef.current as HTMLAudioElement
                                        await ref.play()
                                      }
                                    }} className="cursor-pointer h-3 w-3 text-slate-500" />
                                  </>
                                }
                                <p className={`text-xs ${goodState ? "text-green-500" : "text-red-500"}`}>
                                  {audioDataIndex}) {!goodState && (diffCharacters > 0 ? `+${diffCharacters}c` : `${diffCharacters}c`)}
                                </p>
                              </div>
                              :
                              <p className="text-xs text-slate-300">{audioDataIndex})</p>
                          }
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
                          onBlur={async () => {
                            await synthesizeAudio()
                          }}
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
                  }
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
