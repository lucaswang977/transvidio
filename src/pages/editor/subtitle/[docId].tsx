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
  OnScreenTextItem,
  DubbingItemParams
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
  Brackets,
  Copy,
  FlagTriangleRight,
  MoreHorizontal,
  PlayCircle,
  Plug2,
  PlusCircle,
  SeparatorHorizontal,
  TimerReset,
  Trash,
  X,
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
  params: DubbingItemParams,
}

const SubtitleEditor = React.forwardRef<AutofillHandler | null, EditorComponentProps>(
  ({ srcJson, dstJson, handleChange, permission, setAutoFillInit }, ref) => {
    const reactPlayerRef = React.useRef<ReactPlayer>(null)
    const [playing, setPlaying] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [captions, setCaptions] = React.useState({ src: "", dst: "" })
    const [ostIndexes, setOstIndexes] = React.useState<number[]>([])
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const [dubbingData, setDubbingData] = React.useState<DubbingDataItem[]>([])
    const [dubbingPlaying, setDubbingPlaying] = React.useState(false)
    const [videoDuration, setVideoDuration] = React.useState<number>()
    const [mergedDubbingData, setMergedDubbingData] = React.useState<DubbingDataItem>()
    const audioRef = React.useRef(null);

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

    const playSynthedAudio = async (index?: number) => {
      if (audioRef.current && reactPlayerRef.current) {
        const audioElement = audioRef.current as HTMLAudioElement

        if (index !== undefined) {
          const audioData = dubbingData.at(index)

          if (audioData) {
            reactPlayerRef.current.seekTo(audioData.from / 1000)
            const audioUrl = URL.createObjectURL(audioData.audioBlob)
            if (audioUrl) {
              setDubbingPlaying(true)
              setPlaying(true)

              audioElement.src = audioUrl
              await audioElement.play();
            }
          }
        } else {
          if (mergedDubbingData) {
            reactPlayerRef.current.seekTo(0)
            const audioUrl = URL.createObjectURL(mergedDubbingData.audioBlob)
            if (audioUrl) {
              setDubbingPlaying(true)
              setPlaying(true)

              audioElement.src = audioUrl
              await audioElement.play();
            }
          }
        }
      }
    }

    const generateSynthText = (text: string, params: DubbingItemParams) => {
      const result = `
      <voice name="${params.voice}">
      <mstts:silence type="Tailing-exact" value="0ms" />
      <prosody rate="${(params.rate * 100).toFixed(0)}%">
        ${text}
      </prosody>
      </voice>`
      return result
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

    const synthDubbingData = async (index?: number) => {
      if (index === undefined) {
        if (dstObj.dubbing) {
          let index = 0
          for (const data of dstObj.dubbing) {
            const text = data.text
            const from = data.from
            const params = { ...data.params }
            if (text && from !== undefined) {
              const result = await synthText(generateSynthText(text, params))
              if (result) {
                setDubbingData(data => {
                  const newData = clone(data)
                  newData[index] = {
                    from: from,
                    text: text,
                    audioBlob: result.blob,
                    audioDuration: result.duration,
                    params: params,
                  }
                  return (newData)
                })
              }
            }

            index++
          }
        }
      } else {
        const text = dstObj.dubbing?.at(index)?.text
        const from = dstObj.dubbing?.at(index)?.from
        const params = dstObj.dubbing?.at(index)?.params
        if (text && from !== undefined && params) {
          const result = await synthText(generateSynthText(text, params))
          if (result) {
            setDubbingData(data => {
              const newData = clone(data)
              newData[index] = {
                from: from,
                text: text,
                audioBlob: result.blob,
                audioDuration: result.duration,
                params: { ...params },
              }
              return (newData)
            })
          }
        }
      }
    }

    const isGoodAudioState = (textDuration: number, audioDuration: number) => {
      return Math.abs(textDuration - audioDuration) <= 100
    }

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
            volume={dubbingPlaying ? 0.1 : 1}
            ost={osts}
            playing={playing}
            handleOstDragged={handleOstDragged}
            handleProgress={(p: number) => setProgress(p)}
            handlePlay={(p: boolean) => {
              setPlaying(p)
              if (!p && dubbingPlaying) {
                if (audioRef.current) {
                  const audioElement = audioRef.current as HTMLAudioElement
                  audioElement.pause()
                }

                setDubbingPlaying(false)
              }
            }}
            handleDuration={(d: number) => setVideoDuration(d)}
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
                      subIndexes: [i],
                      params: {
                        voice: "zh-CN-YunjianNeural",
                        rate: 0,
                      }
                    }
                  })
                })
              }}>Reset to subtitle</Button>
              <Button variant="outline" onClick={async () => {
                await synthDubbingData()
              }}>Synthesize All</Button>
              <Button className="text-sm" variant="outline" onClick={async () => {
                if (dstObj.dubbing && dstObj.dubbing.length > 0) {
                  const dubbing: string[] = []
                  let lastTo = 0
                  dstObj.dubbing.forEach((item) => {
                    const pause = item.from - lastTo
                    if (pause > 0) {
                      dubbing.push(`<voice name="zh-CN-YunjianNeural"><break time="${pause}ms" /></voice>`)
                    }

                    dubbing.push(generateSynthText(item.text, item.params))
                    lastTo = item.to
                  })
                  const result = await synthText(dubbing.join("\n"))
                  if (result) {
                    setMergedDubbingData({
                      from: 0,
                      text: "",
                      audioDuration: result.duration,
                      audioBlob: result.blob,
                      params: {
                        voice: "",
                        rate: 0,
                      }
                    })
                  }
                }
              }}>Synthesize Entire</Button>

              <Button variant="outline" onClick={async () => {
                await playSynthedAudio()
              }}>Play Entire</Button>

              <audio className="hidden" ref={audioRef} onEnded={() => {
                setDubbingPlaying(false)
                setPlaying(false)
              }} />
            </div>
            <div className="flex space-x-1 justify-center items-center w-full">
              <Label className="text-xs text-gray-300">{mergedDubbingData ? (mergedDubbingData.audioDuration / 1000).toFixed(3) : 0} / </Label>
              <Label className="text-xs text-gray-300">{videoDuration !== undefined && videoDuration.toFixed(3)}</Label>
            </div>


            <ScrollArea className="h-[60vh] lg:h-[80vh]">
              <div className="flex flex-col space-y-1 pr-1">
                {
                  dstObj && dstObj.dubbing &&
                  dstObj.dubbing.map((item, index) => {
                    const dubbingText = dstObj.dubbing?.at(index)
                    const nextDubbingText = dstObj.dubbing?.at(index + 1)
                    const dubbingAudio = dubbingData.at(index)
                    const rateHint = dubbingAudio ? (dubbingAudio.audioDuration / (item.to - item.from) - 1) : 0
                    const goodState = isGoodAudioState((dubbingText?.to ?? 0) - (dubbingText?.from ?? 0), dubbingAudio?.audioDuration ?? 0)
                    const focusedIncludedInDubbing = focusedIndex != null && dubbingText && dubbingText.subIndexes && dubbingText.subIndexes.includes(focusedIndex)
                    const audioReady = (dubbingAudio && dubbingAudio.text === dubbingText?.text)

                    return (
                      <div
                        className="flex flex-col w-fit items-center"
                        key={`dubbing-${index}`}
                      >
                        <div
                          className={`flex m-2 space-x-1 ${focusedIncludedInDubbing ? "border-red-200 border-l-4 pl-2" : "pl-3"}`}>
                          <div className="flex flex-col justify-between items-end pr-1">
                            <div className="flex flex-col space-y-1 items-end">
                              <Label className="text-xs text-slate-300">{timeFormat(item.from)}</Label>
                              <Label className="text-xs text-slate-300">{((item.to - item.from) / 1000).toFixed(3)}s</Label>
                              <Label className={goodState ? "text-xs text-slate-300" : "text-xs text-red-500"}>
                                {audioReady ? ((dubbingAudio.audioDuration ?? 0) / 1000).toFixed(3) : "0"}s
                              </Label>

                              <div className="flex items-center justify-center space-x-1">
                                <Label className="text-xs text-slate-300">{(item.params.rate * 100).toFixed(0)}%</Label>
                                {
                                  item.params.rate !== 0 ?
                                    <Button variant="ghost" className="p-0 h-4 w-4" onClick={async () => {
                                      if (dstObj.dubbing) {
                                        const dubs = [...dstObj.dubbing]
                                        const dub = dubs[index]
                                        if (dub) {
                                          dub.params.rate = 0
                                        }
                                        handleChange("dst", { ...dstObj, dubbing: dubs })
                                        await synthDubbingData(index)
                                      }

                                    }}>
                                      <X className="w-3 h-3 text-slate-300" />
                                    </Button>
                                    :
                                    (!goodState && dubbingAudio) &&
                                    (
                                      (rateHint < 0.2 && rateHint > 0) ?
                                        <Button variant="ghost" className="p-0 h-4 w-4" onClick={async () => {
                                          if (dstObj.dubbing) {
                                            const dubs = [...dstObj.dubbing]
                                            const dub = dubs[index]
                                            if (dub) {
                                              dub.params.rate = rateHint
                                            }
                                            handleChange("dst", { ...dstObj, dubbing: dubs })
                                            await synthDubbingData(index)
                                          }

                                        }}>
                                          {
                                            tooltipWrapped(
                                              <FlagTriangleRight className="w-3 h-3" />,
                                              <p>Set to {(rateHint * 100).toFixed(0)}%</p>
                                            )
                                          }
                                        </Button>
                                        :
                                        tooltipWrapped(
                                          (<AlertTriangle className="w-3 h-3 text-red-300" />),
                                          (<><p>Rate ({(rateHint * 100).toFixed(0)}%) is not good for synthesize. </p>
                                            <p>Consider modifying the content, merging the lines, or adding breaks.</p></>)
                                        )
                                    )
                                }
                              </div>

                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  className="p-0 h-4 w-4"
                                  onClick={async () => {
                                    await synthDubbingData(index)
                                  }}
                                ><Plug2 className="h-3 w-3" /></Button>
                                <Button
                                  variant="ghost"
                                  className="p-0 h-4 w-4"
                                  disabled={!audioReady}
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
                            id={`dubbing.textarea.${index}`}
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
                          <div className="flex flex-col space-y-2">
                            <Button variant="outline"
                              className="h-5 w-5 p-0 rounded-sm"
                              onClick={() => {
                                if (dstObj.dubbing) {
                                  const dubs = [...dstObj.dubbing]
                                  const dub = dubs[index]
                                  if (dub) {
                                    const element = document.getElementById(`dubbing.textarea.${index}`) as HTMLTextAreaElement
                                    if (element) {
                                      const pos = element.selectionStart
                                      dub.text = `${dub.text.slice(0, pos)}<break time="100ms" />${dub.text.slice(pos)}`
                                      element.focus()
                                    }
                                  }
                                  handleChange("dst", { ...dstObj, dubbing: dubs })
                                }
                              }}
                            >
                              {
                                tooltipWrapped(
                                  <Brackets className="h-4 w-4" />,
                                  <p>Insert a break at current position</p>
                                )
                              }
                            </Button>

                            <Button
                              variant="outline"
                              className="h-5 w-5 p-0 rounded-sm"
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
                                          subIndexes: [i],
                                          params: {
                                            voice: dub.params.voice,
                                            rate: dub.params.rate,
                                          }
                                        })
                                        // TODO: Unmerge to insert empty items to hold the positions.
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

                            <Button variant="outline"
                              className="h-5 w-5 p-0 rounded-sm"
                              disabled={!dstObj.dubbing?.at(index + 1)}
                              onClick={() => {
                                if (dstObj.dubbing) {
                                  const dubTexts = [...dstObj.dubbing]
                                  const dubText = dubTexts[index]
                                  const nextDubText = dubTexts[index + 1]
                                  if (dubText && nextDubText) {
                                    dubText.to = nextDubText.to
                                    dubText.text = `${dubText.text} ${nextDubText.text}`
                                    dubText.subIndexes.push(...nextDubText.subIndexes)
                                  }
                                  dubTexts.splice(index + 1, 1)

                                  if (dubbingData && dubbingData.at(index) && dubbingData.at(index + 1)) {
                                    setDubbingData([...dubbingData.splice(index + 1, 1)])
                                  }
                                  handleChange("dst", { ...dstObj, dubbing: dubTexts })
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
                        {
                          dubbingText && nextDubbingText && nextDubbingText.from - dubbingText.to > 0 &&
                          <p className="text-xs text-slate-300">{nextDubbingText.from - dubbingText.to}ms</p>
                        }
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
