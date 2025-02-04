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
//   ],
//   dubbing : [
//     {
//       from: 11.22,
//       to: 22.33,
//       text: "wowowow",
//       subIndexes: [0],
//       params: {
//         voice: "",
//         rate: 0
//       }
//     }
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
  audioData: ArrayBuffer | undefined,
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
    const [dubbingPlayingContext, setDubbingPlayingContext] = React.useState<AudioContext | undefined>()
    const [videoDuration, setVideoDuration] = React.useState<number>()

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

    const getAudioContext = () => {
      return new window.AudioContext()
    }

    const playAudio = (audioBuffer: AudioBuffer, onPlayEnd?: () => void) => {
      const audioContext = getAudioContext()
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      if (onPlayEnd) {
        source.onended = () => {
          console.log("play end")
          onPlayEnd()
        };
      }

      source.connect(audioContext.destination);

      const startTime = audioContext.currentTime;
      source.start(startTime);
      source.stop(startTime + audioBuffer.duration);

      return audioContext
    }

    const pcmArrayBufferToAudioBuffer = (data: ArrayBuffer) => {
      const audioContext = getAudioContext()
      const audioBuffer = audioContext.createBuffer(1, data.byteLength / 2, 16000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(data);
      for (let i = 0; i < data.byteLength / 2; i++) {
        const pcmData = dataView.getInt16(i * 2, true)
        channelData[i] = pcmData / 32768.0
      }
      return audioBuffer
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
        console.log("Synthesize: ", text)
        const apiUrl = "/api/synthesis";
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            body: JSON.stringify({
              voices: text,
            })
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const audioData = await response.arrayBuffer()
          const audioDuration = audioData.byteLength / (16000 * 16 * 1 / 8) * 1000
          console.log("syntheize complete")
          return { data: audioData, duration: audioDuration }
        } catch (error) {
          console.error('Error fetching audio data:', error);
        }
      }
    }

    const generateBlankAudioArrayBuffer = (durationInMs: number) => {
      const sampleRate = 16000
      const duration = durationInMs / 1000;
      const numChannels = 1
      const numSamples = Math.ceil(duration * sampleRate * numChannels)

      const data = new Int16Array(numSamples)

      for (let i = 0; i < numSamples; i++) {
        data[i] = 0
      }

      return data.buffer
    }

    const concatenateTwoArrayBuffers = (b1: ArrayBuffer, b2: ArrayBuffer) => {
      const combinedBuffer = new ArrayBuffer(b1.byteLength + b2.byteLength)
      const dataView = new DataView(combinedBuffer)
      for (let i = 0; i < b1.byteLength; i++) {
        dataView.setUint8(i, new DataView(b1).getUint8(i));
      }
      for (let i = 0; i < b2.byteLength; i++) {
        dataView.setUint8(b1.byteLength + i, new DataView(b2).getUint8(i));
      }

      return combinedBuffer
    }

    const getAudioDurationInMs = (data: ArrayBuffer) => {
      return data.byteLength / (16000 * 16 / 8 * 1) * 1000
    }

    const mergeSynthedVoices = () => {
      let mergedBuffer: ArrayBuffer = new ArrayBuffer(0)

      if (dubbingData) {
        dubbingData.forEach((item, index) => {
          if (index === 0 && item.from > 0) {
            const blankBuffer = generateBlankAudioArrayBuffer(item.from)
            mergedBuffer = concatenateTwoArrayBuffers(mergedBuffer, blankBuffer)
            console.log("merged blank:", item.from, mergedBuffer.byteLength)
          }
          if (item.audioData && dstObj.dubbing) {
            const dubbingLastItem = dstObj.dubbing[index - 1]
            const dubbingCurrentItem = dstObj.dubbing[index]
            if (dubbingCurrentItem && dubbingLastItem) {
              const blankDuration = dubbingCurrentItem.from - dubbingLastItem.to +
                (dubbingCurrentItem.to - dubbingCurrentItem.from - getAudioDurationInMs(item.audioData))
              if (blankDuration > 0) {
                const blankBuffer = generateBlankAudioArrayBuffer(blankDuration)
                mergedBuffer = concatenateTwoArrayBuffers(mergedBuffer, blankBuffer)
                console.log("merged blank:", blankDuration, mergedBuffer.byteLength)
              }
            }

            mergedBuffer = concatenateTwoArrayBuffers(mergedBuffer, item.audioData)
            console.log("merged:", item.text, mergedBuffer.byteLength)
          }
        })
      }
      console.log("merged length: ", getAudioDurationInMs(mergedBuffer))

      return mergedBuffer
    }

    const synthDubbingData = async (index: number) => {
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
              audioData: result.data,
              audioDuration: result.duration,
              params: { ...params },
            }
            return (newData)
          })
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

    const getDubbingAudioDuration = () => {
      const sum = dubbingData ? dubbingData.reduce((sum, item) => sum + item.audioDuration, 0) : 0
      return sum
    }

    const getDubbingBreakDuration = () => {
      let sum = 0
      const dubbing = dstObj.dubbing
      if (dubbing) {
        const firstItem = dubbing[0]
        if (firstItem) sum += firstItem.from

        dubbing.slice(1).forEach((item, index) => {
          const lastItem = dubbing[index]
          if (lastItem) {
            sum += item.from - lastItem.to
          }
        })
      }

      return sum
    }

    const resetDubbingToSubtitles = () => {
      if (dstObj && dstObj.subtitle) {
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
      }
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

    React.useEffect(() => {
      if (dstObj.dubbing && dubbingData) {
        const newDubbingData: DubbingDataItem[] = []
        dstObj.dubbing.forEach((item, index) => {
          const dubItem = dubbingData.find(i => {
            if (i.from === item.from && i.text === item.text &&
              (i.params.voice === item.params.voice
                && i.params.rate === item.params.rate)) {
              return i
            }
          })
          if (dubItem) {
            newDubbingData[index] = dubItem
          } else {
            newDubbingData[index] = {
              from: item.from,
              text: item.text,
              params: { ...item.params },
              audioData: undefined,
              audioDuration: 0,
            }
          }
        })

        setDubbingData(newDubbingData)
      }
    }, [dstObj.dubbing])

    return (
      <div className="pt-8 flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2">
        <div className="flex flex-col mb-4 lg:order-last lg:mx-4 items-center justify-center space-y-2">
          <VideoPlayer
            url={srcObj.videoUrl}
            ref={reactPlayerRef}
            caption={captions.dst}
            volume={dubbingPlayingContext ? 0.1 : 1}
            ost={osts}
            playing={playing}
            handleOstDragged={handleOstDragged}
            handleProgress={(p: number) => setProgress(p)}
            handlePlay={async (p: boolean) => {
              setPlaying(p)
              if (p == false && dubbingPlayingContext) {
                await dubbingPlayingContext.suspend()
                setDubbingPlayingContext(undefined)
              }
            }}
            handleDuration={(d: number) => setVideoDuration(d)}
          >
          </VideoPlayer>
        </div>

        <Tabs
          // Subtitle Tab
          defaultValue="subtitle">
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

          <TabsContent
            // On Screen Text Tab
            value="ost">
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

          <TabsContent
            // Dubbing Tab
            value="dubbing">
            {
              (dstObj && dstObj.dubbing) ?
                (
                  <>
                    <div className="flex space-x-2 items-center justify-center py-1">
                      <Button variant="outline" onClick={() => {
                        resetDubbingToSubtitles()
                      }}>Reset to subtitle</Button>
                      <Button variant="outline" onClick={async () => {
                        if (dstObj.dubbing) {
                          let i = 0
                          for (const obj of dstObj.dubbing) {
                            const item = dubbingData.at(i)
                            if (obj.text && (!item || !item.audioData || item.audioDuration == 0)) {
                              await synthDubbingData(i)
                            }
                            i++
                          }
                        }
                      }}>Synthesize All</Button>
                      <Button
                        variant="outline"
                        disabled={!dubbingData ||
                          dubbingData.find(item =>
                            (item.audioData === undefined || item.audioDuration === 0)) !== undefined}
                        onClick={() => {
                          const mergedBuffer = mergeSynthedVoices()
                          if (mergedBuffer) {
                            if (reactPlayerRef.current) {
                              reactPlayerRef.current.seekTo(0, "seconds")
                            }
                            const audioBuffer = pcmArrayBufferToAudioBuffer(mergedBuffer)
                            const audioContext = playAudio(audioBuffer, () => {
                              setDubbingPlayingContext(undefined)
                              setPlaying(false)
                            })

                            setDubbingPlayingContext(audioContext)
                            setPlaying(true)
                          }

                        }}>Play Entire</Button>
                    </div>
                    <div className="flex space-x-1 justify-center items-center w-full">
                      <Label className="text-xs text-gray-300">{
                        ((getDubbingAudioDuration() + getDubbingBreakDuration()) / 1000).toFixed(3)
                      } / </Label>
                      <Label className="text-xs text-gray-300">{videoDuration !== undefined && videoDuration.toFixed(3)}</Label>
                    </div>

                    <ScrollArea className="h-[60vh] lg:h-[80vh]">
                      <div className="flex flex-col space-y-1 pr-1">
                        {
                          dstObj.dubbing.map((item, index) => {
                            const dubbingText = dstObj.dubbing?.at(index)
                            const nextDubbingText = dstObj.dubbing?.at(index + 1)
                            const dubbingAudio = dubbingData.at(index)
                            const rateHint = dubbingAudio ? (dubbingAudio.audioDuration / (item.to - item.from) - 1) : 0
                            const goodState = isGoodAudioState((dubbingText?.to ?? 0) - (dubbingText?.from ?? 0), dubbingAudio?.audioDuration ?? 0)
                            const focusedIncludedInDubbing = focusedIndex != null && dubbingText && dubbingText.subIndexes && dubbingText.subIndexes.includes(focusedIndex)
                            const audioReady = (dubbingAudio && dubbingAudio.audioData && dubbingAudio.text === dubbingText?.text)

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
                                          onClick={() => {
                                            const data = dubbingData.at(index)?.audioData
                                            const from = dubbingData.at(index)?.from
                                            if (data && from !== undefined) {
                                              if (data) {
                                                if (reactPlayerRef.current) {
                                                  reactPlayerRef.current.seekTo(from / 1000, "seconds")
                                                }
                                                const audioBuffer = pcmArrayBufferToAudioBuffer(data)
                                                const audioContext = playAudio(audioBuffer, () => {
                                                  setDubbingPlayingContext(undefined)
                                                  setPlaying(false)
                                                })

                                                setDubbingPlayingContext(audioContext)
                                                setPlaying(true)
                                              }
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
                                                    rate: 0,
                                                  }
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
                  </>)
                :
                <div className="w-[600px] flex justify-center items-center pt-2">
                  <Button variant="outline" onClick={() => {
                    resetDubbingToSubtitles()
                  }}>Start create dubbing</Button>
                </div>
            }
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
