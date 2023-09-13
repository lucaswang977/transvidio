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
import type {
  SubtitleType,
  ProjectAiParamters,
  RelativePositionType,
  OnScreenTextItem
} from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { cn, timeFormat } from "~/utils/helper"
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
import {
  AlertTriangle,
  ArrowBigDownDash,
  Copy,
  MoreHorizontal,
  PlayCircle,
  Plug2,
  PlusCircle,
  SeparatorHorizontal,
  TimerReset,
  Trash,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"

import { Icons } from "~/components/ui/icons"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { tooltipWrapped } from "~/components/ui/tooltip"

const regexToSegementSentence = /[。！]+$/

const ColorSelectPopover = (
  props: {
    color: string | undefined,
    opacity: string | undefined,
    onSelect: (v: string) => void
  }
) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-3 h-3", props.color ?? "text-white")}>
          <Icons.rect
            fillOpacity={props.opacity ? parseInt(props.opacity) / 100 : 100}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit text-sm text-gray-600">
        <RadioGroup
          defaultValue={props.color ?? "text-white"}
          onValueChange={(v) => { props.onSelect(v) }}
        >
          {
            [
              "text-white",
              "text-black",
              "text-red-500",
              "text-green-500",
              "text-blue-500",
              "text-yellow-500"
            ].map(item => {
              return (
                <div key={item} className="flex items-center space-x-1">
                  <RadioGroupItem value={item} />
                  <Icons.rect className={`h-3 w-3 ${item}`}
                  />
                  <p className="ml-2">{item}</p>
                </div>
              )
            })
          }
        </RadioGroup>
      </PopoverContent>
    </Popover>
  )
}

const FontSizeSelectPopover = (
  props: {
    size: string | undefined,
    onSelect: (v: string) => void
  }
) => {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-3 h-3 text-gray-500 text-[11px]">
          {
            props.size ? (props.size.match(/\[(\d+)px\]/)?.[1] || "14") : "14"
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit text-sm">
        <RadioGroup
          defaultValue={props.size ?? "text-[14px]"}
          onValueChange={(v) => { props.onSelect(v) }}
        >
          {
            [
              "text-[10px]",
              "text-[11px]",
              "text-[12px]",
              "text-[13px]",
              "text-[14px]",
              "text-[15px]",
              "text-[16px]",
              "text-[17px]",
              "text-[18px]",
              "text-[19px]",
              "text-[20px]",
            ].map(item => {
              return (
                <div key={item} className="flex items-center space-x-1">
                  <RadioGroupItem value={item} />
                  <p className="ml-2">{item}</p>
                </div>
              )
            })
          }
        </RadioGroup>
      </PopoverContent>
    </Popover>

  )
}

type DubbingDataItem = {
  from: number,
  text: string,
  audioBlob: Blob,
  audioDuration: number,
}

const SubtitleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const reactPlayerRef = React.useRef<ReactPlayer>(null);
    const [progress, setProgress] = React.useState(0)
    const [captions, setCaptions] = React.useState({ src: "", dst: "" })
    const [ostIndexes, setOstIndexes] = React.useState<number[]>([])
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const [dubbingData, setDubbingData] = React.useState<DubbingDataItem[]>([])
    // const [currentItemIndex, setCurrentItemIndex] = React.useState(0)
    // const [currentAudioPlayPosition, setCurrentAudioPlayPostision] = React.useState(0)
    const [isSynthAudioPlaying, setIsSynthAudioPlaying] = React.useState(false)
    // const [audioSynthParams, setAudioSynthParams] =
    //   React.useState<AudioSynthesisParamsType | undefined>({
    //     lang: "zh-CN",
    //     voice: "zh-CN-YunjianNeural",
    //     rate: "20%"
    //   })
    const audioRef = React.useRef(null);
    // const singleAudioRef = React.useRef(null);

    const defaultValue: SubtitleType = {
      videoUrl: "",
      subtitle: [],
      ost: [],
      dubbing: [],
    }

    let srcObj = defaultValue
    let dstObj = defaultValue
    if (srcJson) srcObj = srcJson as SubtitleType
    if (dstJson) dstObj = dstJson as SubtitleType

    React.useImperativeHandle(ref, () => {
      return { autofillHandler: handleAutoFill }
    }, [srcJson, dstJson])

    React.useEffect(() => {
      if (setAutoFillInit) setAutoFillInit(true)
    }, [])

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

    /*
    const base64ToBlob = (base64: string | undefined) => {
      if (base64) {
        const parts = base64.split(';base64,');
        if (parts[0] && parts[1]) {
          const mimeType = parts[0].split(':')[1];
          const raw = window.atob(parts[1]);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);

          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          return new Blob([uInt8Array], { type: mimeType });
        }
      }
      return undefined
    }
    */

    const playSynthedAudio = async (index: number) => {
      if (audioRef.current && reactPlayerRef.current) {
        const audioElement = audioRef.current as HTMLAudioElement
        const audioData = dubbingData.at(index)

        if (audioData) {
          reactPlayerRef.current.seekTo(audioData.from / 1000)
          const audioUrl = URL.createObjectURL(audioData.audioBlob)
          if (audioUrl) {
            audioElement.src = audioUrl
            await audioElement.play();
          }
        }
      }
    }

    const playAudio = async () => {
      /*
      if (audioRef.current && audioData) {
        const audioElement = audioRef.current as HTMLAudioElement

        const currentAudioData = audioData[currentItemIndex]
        const blob = base64ToBlob(currentAudioData?.audioData)
        if (blob) {
          const currentAudioUrl = URL.createObjectURL(blob)
          let pauseDuration = currentAudioData ? currentAudioData.from - currentAudioPlayPosition : 0
          if (pauseDuration < 0) pauseDuration = 0
          console.log("audio:",
            currentItemIndex,
            currentAudioPlayPosition,
            currentAudioData?.from,
            currentAudioData?.to,
            currentAudioData?.audioDuration,
            currentAudioData?.textDuration,
            pauseDuration)

          if (pauseDuration > 0)
            await new Promise(resolve => setTimeout(resolve, pauseDuration));

          if (currentAudioUrl) {
            audioElement.src = currentAudioUrl
            await audioElement.play();
          }

          if (currentItemIndex < audioData.length) {
            setCurrentItemIndex(currentItemIndex + 1);
            setCurrentAudioPlayPostision(v => {
              if (currentAudioData)
                return currentAudioData.to
              else
                return v
            })
          } else {
            (audioRef.current as HTMLAudioElement).pause()
            setCurrentItemIndex(0)
            setCurrentAudioPlayPostision(0)
            setIsSynthAudioPlaying(false)
          }
        }
      }
      */
    }

    const synthText = async (text: string) => {
      if (text.length > 0) {
        const apiUrl = "/api/synthesis";
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            body: JSON.stringify({
              phrase: text,
            })
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const durationStr = response.headers.get("Audio-Duration")
          const audioDuration = Math.floor(parseFloat(durationStr ? durationStr : "0") * 1000)
          const audioBlob = await response.blob();
          console.log("audio synthesized: ", audioDuration)
          return { blob: audioBlob, duration: audioDuration }
        } catch (error) {
          console.error('Error fetching audio data:', error);
        }
      }
    }

    const synthesizeAudio = async () => {
      /*
      if (dstObj && dstObj.subtitle) {
        const emptyAudioSynthesisData: AudioSynthesisType = {
          subtitleItemIds: [],
          from: 0,
          to: 0,
          text: "",
          textDuration: 0,
          audioData: "",
          audioDuration: 0,
          audioParams: audioSynthParams,
        }
        const result: AudioSynthesisType[] = []
        let dstSentences: string[] = []
        let subtitleItemIds: number[] = []
        let index = 0
        let data = emptyAudioSynthesisData

        dstObj.subtitle.forEach(item => {
          if (dstSentences.length === 0) {
            data.from = item.from
          }

          const dstItem = dstObj.subtitle[index]
          if (dstItem) {
            dstSentences.push(dstItem.text)
            subtitleItemIds.push(index)
          }

          if (regexToSegementSentence.test(dstSentences.join("").trim())) {
            data.text = dstSentences.join("")
            data.subtitleItemIds = [...subtitleItemIds]
            data.to = item.to
            data.textDuration = data.to - data.from
            dstSentences = []
            subtitleItemIds = []
            result.push({ ...data })
            data = emptyAudioSynthesisData
          }
          index = index + 1
        })

        const origData = dstObj.audio
        for (const item of result) {
          const origItem = origData ?
            origData.find(i => i.from === item.from && i.to === item.to)
            : undefined

          if (origItem && origItem.text === item.text) {
            item.audioData = origItem.audioData
            item.audioDuration = origItem.audioDuration
          } else {
            const text = item.text
            if (text.length > 0) {
              const apiUrl = "/api/synthesis";
              try {
                const response = await fetch(apiUrl, {
                  method: "POST",
                  body: JSON.stringify({
                    phrase: text,
                    params: item.audioParams
                  })
                });
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const durationStr = response.headers.get("Audio-Duration")
                item.audioDuration = Math.floor(parseFloat(durationStr ? durationStr : "0") * 1000)
                const audioBlob = await response.blob();
                item.audioData = await (new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = function() {
                    resolve(reader.result as string);
                  }
                  reader.onerror = reject;
                  reader.readAsDataURL(audioBlob);
                }))
                console.log("audio synthesized: ", item)
              } catch (error) {
                console.error('Error fetching audio data:', error);
              }
            }
          }
        }

        handleChange("dst", dstObj => {
          return { ...(dstObj as SubtitleType), audio: result }
        })
      }
      */
    }

    const isGoogdAudioState = (textDuration: number, audioDuration: number) => {
      return Math.abs(audioDuration - textDuration) <= 200
    }


    /*
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

    const focusedAudioData = audioData ? audioData[getAudioDataByIndex(focusedIndex)] : undefined
    */

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

    const handleOstDragged = (index: number, position: RelativePositionType) => {
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

    React.useEffect(() => {
      const index = srcObj.subtitle.findIndex(
        (item) =>
          (progress * 1000 >= item.from) &&
          (progress * 1000 <= item.to))
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
            if ((progress * 1000 >= item.from) &&
              (progress * 1000 <= item.to)) {
              osts.push(i)
            }
            i++
          })
        setOstIndexes(osts)
      }

      setFocusedIndex(index)
    }, [progress, srcObj, dstObj])

    return (
      <div className="pt-8 flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2">
        <div className="flex flex-col mb-4 lg:order-last lg:mx-4 items-center justify-center space-y-2">
          <VideoPlayer
            url={srcObj.videoUrl}
            ref={reactPlayerRef}
            caption={captions.dst}
            muted={isSynthAudioPlaying}
            ost={osts}
            handleOstDragged={handleOstDragged}
            handleProgress={(p: number) => setProgress(p)}
          >
          </VideoPlayer>
        </div>

        <Tabs defaultValue="subtitle">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subtitle">Subtitle</TabsTrigger>
            <TabsTrigger value="ost">On Screen Text</TabsTrigger>
            <TabsTrigger value="dubbing">Dubbing</TabsTrigger>
          </TabsList>
          <TabsContent value="subtitle">
            <ScrollArea className="h-[60vh] lg:h-[85vh]">
              <div className="flex space-x-2 p-2">
                <div className="flex flex-col">
                  {
                    srcObj.subtitle.map((item, index) => {
                      const dstItem = dstObj.subtitle[index] ? dstObj.subtitle[index] : {
                        ...item,
                        text: ""
                      }

                      return (
                        <div
                          key={`src-${index}`}
                          className={`flex m-2 space-x-1 ${focusedIndex === index ? "border-red-200 border-l-4 pl-2" : "pl-3"}`}>
                          <div className="flex flex-col justify-between items-end pr-1">
                            <div className="flex flex-col space-y-1 items-end">
                              <Label className="text-xs text-slate-300">{timeFormat(item.from)}</Label>
                              <Label className="text-xs text-slate-300">{timeFormat(item.to)}</Label>
                            </div>
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
          </TabsContent>

          <TabsContent value="ost">
            <ScrollArea className="h-[60vh] lg:h-[85vh]">
              <div className="flex flex-col space-y-2 pt-2 pr-1">
                {
                  dstObj.ost && dstObj.ost.map((ost, index) => {
                    return (
                      <div
                        key={`ost.${index}`}
                        className="flex"
                      >
                        <div className="flex flex-col space-y-2">
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
                            }}>
                            {
                              tooltipWrapped(
                                <div className="flex space-x-1 items-center">
                                  <TimerReset className="h-3 w-3" />
                                  <p>{timeFormat(ost.from)}</p>
                                </div>
                                ,
                                <p>Use video position as the timestamp</p>
                              )
                            }
                          </Button>
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
                            }}>
                            {
                              tooltipWrapped(
                                <div className="flex space-x-1 items-center">
                                  <TimerReset className="h-3 w-3" />
                                  <p>{timeFormat(ost.to)}</p>
                                </div>
                                ,
                                <p>Use video position as the timestamp</p>
                              )
                            }
                          </Button>
                        </div>
                        <div className="relative">
                          <Textarea
                            disabled={!permission.dstWritable}
                            value={ost.text}
                            className="overflow-hidden w-[500px] resize-none"
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
                              }
                            }}
                          />
                          <div className="flex space-x-2 absolute bottom-2 right-3">
                            {
                              /\n{2,}/.test(ost.text) &&
                              tooltipWrapped(
                                <AlertTriangle className="h-3 w-3 text-red-400 mr-2" />,
                                <>
                                  <p>Do not use consecutive line breaks for text layout,</p>
                                  <p>create multiple On Screen Texts instead.</p>
                                </>
                              )
                            }
                            <ColorSelectPopover
                              onSelect={(v: string) => {
                                handleChange("dst", o => {
                                  const d = clone(o ? (o as SubtitleType) : defaultValue)
                                  const ost = d.ost
                                  if (ost) {
                                    const t = ost[index]
                                    if (t) {
                                      t.attr.color = v
                                      return d
                                    }
                                  }
                                  return d
                                })
                              }}
                              color={ost.attr.color}
                              opacity={ost.attr.opacity}
                            />

                            <FontSizeSelectPopover
                              size={ost.attr.size}
                              onSelect={(v) => {
                                handleChange("dst", o => {
                                  const d = clone(o ? (o as SubtitleType) : defaultValue)
                                  const ost = d.ost
                                  if (ost) {
                                    const t = ost[index]
                                    if (t) {
                                      t.attr.size = v
                                      return d
                                    }
                                  }
                                  return d
                                })
                              }} />

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("w-3 h-3", "text-gray-500")}>
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  className="flex space-x-2 text-sm"
                                  onSelect={() => {
                                    handleChange("dst", o => {
                                      const d = clone(o ? (o as SubtitleType) : defaultValue)
                                      const ost = d.ost
                                      if (ost) {
                                        const t = ost[index]
                                        if (t) {
                                          ost.splice(index, 0, clone(t))
                                          return d
                                        }
                                      }
                                      return d
                                    })
                                  }}
                                >
                                  <Copy className="h-3 w-3" /><p>Duplicate</p>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="flex space-x-2 text-sm"
                                  onSelect={() => {
                                    handleChange("dst", o => {
                                      const d = clone(o ? (o as SubtitleType) : defaultValue)
                                      const ost = d.ost
                                      if (ost) {
                                        const t = ost[index]
                                        if (t) {
                                          ost.splice(index, 1)
                                          return d
                                        }
                                      }
                                      return d
                                    })
                                  }}
                                >
                                  <Trash className="h-3 w-3" /><p>Remove</p>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
                <Button
                  variant="outline"
                  className="w-[600px] flex text-gray-600"
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
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dubbing">
            <div className="flex space-x-2 items-center justify-center py-1">
              <Button variant="outline" onClick={() => {
                handleChange("dst", {
                  ...dstObj, dubbing: dstObj.subtitle.map((item, i) => {
                    return {
                      from: item.from,
                      to: item.to,
                      text: item.text,
                      subIndexes: [i]
                    }
                  })
                })
              }}>Reset to subtitle</Button>
              <Button variant="outline" onClick={async () => {
                await synthesizeAudio()
              }}>Synthesize All</Button>
              <Button className="text-sm" variant="outline" onClick={async () => {
                if (!isSynthAudioPlaying) {
                  if (reactPlayerRef.current) {
                    reactPlayerRef.current.setState({ playing: true })
                  }
                  setIsSynthAudioPlaying(true);
                  await playAudio();
                } else {
                  setIsSynthAudioPlaying(false);
                  // setCurrentItemIndex(0)
                  // setCurrentAudioPlayPostision(0)
                  if (audioRef.current) {
                    (audioRef.current as HTMLAudioElement).pause()
                  }
                }
              }}>{!isSynthAudioPlaying ? "Play with synth audio" : "Stop"}</Button>
              <audio className="hidden" ref={audioRef} onEnded={playAudio} />
            </div>


            <ScrollArea className="h-[60vh] lg:h-[80vh]">
              <div className="flex flex-col space-y-2 pt-2 pr-1">
                {
                  dstObj && dstObj.dubbing &&
                  dstObj.dubbing.map((item, index) => {
                    const dubbingText = dstObj.dubbing?.at(index)
                    const dubbingAudio = dubbingData.at(index)

                    return (
                      <div
                        key={`dubbing-${index}`}
                        className={`flex m-2 space-x-1 ${focusedIndex != null && dubbingText?.subIndexes.includes(focusedIndex) ? "border-red-200 border-l-4 pl-2" : "pl-3"}`}>
                        <div className="flex flex-col justify-between items-end pr-1">
                          <div className="flex flex-col space-y-1 items-end">
                            <Label className="text-xs text-slate-300">{timeFormat(item.from)}</Label>
                            <Label className="text-xs text-slate-300">{((item.to - item.from) / 1000).toFixed(1)}s</Label>
                            <Label className={isGoogdAudioState((dubbingText?.to ?? 0) - (dubbingText?.from ?? 0), dubbingAudio?.audioDuration ?? 0) ? "text-xs text-slate-300" : "text-xs text-red-500"}>
                              {(dubbingAudio &&
                                dubbingAudio.text === dubbingText?.text) ?
                                ((dubbingAudio.audioDuration ?? 0) / 1000).toFixed(1)
                                : "0"
                              }s
                            </Label>
                            <div className="flex space-x-1">
                              <Button variant="ghost" className="p-0 h-4 w-4"
                                onClick={async () => {
                                  const text = dstObj.dubbing?.at(index)?.text
                                  const from = dstObj.dubbing?.at(index)?.from
                                  if (text && from !== undefined) {
                                    const result = await synthText(text)
                                    if (result) {
                                      setDubbingData(data => {
                                        const newData = clone(data)
                                        newData[index] = {
                                          from: from,
                                          text: text,
                                          audioBlob: result.blob,
                                          audioDuration: result.duration,
                                        }
                                        return (newData)
                                      })
                                    }
                                  }
                                }}
                              ><Plug2 className="h-3 w-3" /></Button>
                              <Button variant="ghost" className="p-0 h-4 w-4"
                                onClick={async () => {
                                  const blob = dubbingData.at(index)?.audioBlob
                                  const from = dubbingData.at(index)?.from
                                  if (blob && from !== undefined) {
                                    await playSynthedAudio(index)
                                  }
                                }}
                              ><PlayCircle className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        </div>
                        <Textarea
                          disabled={!permission.dstWritable}
                          id={`dubbing.items.${index}`}
                          value={item.text}
                          className="overflow-hidden w-[500px]"
                          onChange={(event) => {
                            if (dstObj.dubbing) {
                              const subtitles = [...dstObj.dubbing]
                              const subtitle = subtitles[index]
                              if (subtitle) {
                                subtitle.text = event.target.value
                              } else {
                                subtitles[index] = {
                                  ...item,
                                  text: event.target.value
                                }
                              }
                              handleChange("dst", { ...dstObj, dubbing: subtitles })
                            }
                          }}
                          onFocus={() => {
                            if (reactPlayerRef.current) {
                              const duration = reactPlayerRef.current.getDuration()
                              reactPlayerRef.current.seekTo(item.from / 1000 / duration * 1.001, "fraction")
                            }
                          }}
                        />
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost" size="icon"
                            disabled={dstObj.dubbing?.at(index)?.subIndexes.length == 1}
                            onClick={() => {
                              if (dstObj.dubbing) {
                                const dubs = [...dstObj.dubbing]
                                const dub = dubs[index]
                                if (dub) {
                                  let k = 1
                                  dub.subIndexes.forEach(i => {
                                    const sub = dstObj.subtitle[i]
                                    if (sub) {
                                      dubs.splice(index + k, 0, {
                                        from: sub.from,
                                        to: sub.to,
                                        text: sub.text,
                                        subIndexes: [i]
                                      })
                                      k = k + 1
                                    }
                                  })
                                  dubs.splice(index, 1)
                                }
                                handleChange("dst", { ...dstObj, dubbing: dubs })
                              }
                            }}
                          >
                            {
                              tooltipWrapped(
                                <SeparatorHorizontal className="h-4 w-4" />,
                                <p>Unmerge all</p>
                              )
                            }
                          </Button>

                          <Button variant="ghost" size="icon"
                            disabled={!dstObj.dubbing?.at(index + 1)}
                            onClick={() => {
                              if (dstObj.dubbing) {
                                const dubs = [...dstObj.dubbing]
                                const dub = dubs[index]
                                const nextDub = dubs[index + 1]
                                if (dub && nextDub) {
                                  dub.to = nextDub.to
                                  dub.text = `${dub.text} ${nextDub.text}`
                                  dub.subIndexes.push(...nextDub.subIndexes)
                                }
                                dubs.splice(index + 1, 1)
                                handleChange("dst", { ...dstObj, dubbing: dubs })
                              }
                            }}
                          >
                            {
                              tooltipWrapped(
                                <ArrowBigDownDash className="h-4 w-4" />,
                                <p>Merge down</p>
                              )
                            }
                          </Button>
                        </div>
                      </div>
                    )
                  })
                }
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
