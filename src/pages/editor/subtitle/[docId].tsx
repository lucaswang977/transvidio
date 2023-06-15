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
import { type NextPage } from "next"
import { useRouter } from "next/router"
import { useSession } from "next-auth/react"
import { useQuery } from '@tanstack/react-query'
import { api } from "~/utils/api";
import { parse } from '@plussub/srt-vtt-parser'


import type ArtPlayer from "artplayer"
import { VideoPlayer } from "~/components/ui/video-player"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Save } from "lucide-react"
import type { SubtitleType, SubtitleItem, SrcOrDst } from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { timeFormat } from "~/utils/helper"

type SubtitleEditorProps = {
  docId: string,
  src: SubtitleType,
  dst: SubtitleType
}

const SubtitleEditor = (props: SubtitleEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  useQuery({
    queryKey: ["vttLoading"], queryFn: async () => {
      const result = { src: false, dst: false }
      let srcEntries: SubtitleItem[] = []
      if (props.src && props.src.originalSubtitleUrl && props.src.subtitle.length === 0) {
        const response = await fetch(props.src.originalSubtitleUrl)
        if (response.ok) {
          const vttText = await response.text()
          const { entries } = parse(vttText)
          setEditorValues((values) => {
            return {
              ...values,
              src: {
                ...values.src,
                subtitle: entries
              }
            }
          })
          srcEntries = entries
          result.src = true
        }
      }

      if (props.dst && props.dst.originalSubtitleUrl && props.dst.subtitle.length === 0) {
        const response = await fetch(props.dst.originalSubtitleUrl)
        if (response.ok) {
          const vttText = await response.text()
          const { entries } = parse(vttText)
          setEditorValues((values) => {
            return {
              ...values,
              dst: {
                ...values.dst,
                subtitle: entries
              }
            }
          })
          result.dst = true
        } else {
          const data: SubtitleItem[] = []
          srcEntries.forEach((item) => {
            data.push({
              from: item.from,
              to: item.to,
              text: ""
            })
          })
          setEditorValues((values) => {
            return {
              ...values,
              dst: {
                ...values.dst,
                subtitle: data
              }
            }
          })
          result.dst = true
        }
      }

      return result
    }
  })

  const onInputChange = (t: SrcOrDst, i: number, v: string) => {
    if (t === "src") {
      setEditorValues((values) => {
        if (values.src.subtitle) (values.src.subtitle[i] as SubtitleItem).text = v
        return { ...values, src: { ...values.src, subtitle: values.src.subtitle } }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        if (values.dst.subtitle) (values.dst.subtitle[i] as SubtitleItem).text = v;
        return { ...values, dst: { ...values.dst, subtitle: values.dst.subtitle } }
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

  const [captions, setCaptions] = React.useState({ src: "", dst: "" })
  const [player, setPlayer] = React.useState<ArtPlayer | null>(null)

  React.useEffect(() => {
    if (player) {
      player.on("video:play", () => {
        console.log("video is playing")
      })
      player.on("video:timeupdate", () => {
        const index = editorValues.src.subtitle.findIndex(
          (item) =>
            (player.currentTime * 1000 >= item.from) && (player.currentTime * 1000 <= item.to))
        if (index >= 0) {
          const srcItem = editorValues.src.subtitle[index]
          const dstItem = editorValues.dst.subtitle[index]
          setCaptions({
            src: srcItem?.text ? srcItem.text : "",
            dst: dstItem?.text ? dstItem.text : ""
          })
        }
      })
    }
  }, [player, editorValues])

  return (
    <div className="flex-col space-y-2">
      <Button className="fixed right-6 bottom-6 w-10 rounded-full p-0 z-20"
        disabled={!contentChanged} onClick={() => save()} >
        <Save className="h-4 w-4" />
        <span className="sr-only">Save</span>
      </Button>
      <div className="flex space-x-2 py-6">
        <ScrollArea className="h-[90vh] py-1">
          <div className="flex space-x-6">
            <div className="flex flex-col space-y-2 w-[300px]">
              {
                editorValues.src.subtitle.map((item, index) => {
                  return (
                    <div key={`src-${index}`} className="flex h-full space-x-1">
                      <div className="flex flex-col text-slate-300 py-2">
                        <Label className="text-xs h-full">{timeFormat(item.from)}</Label>
                        <Label className="text-xs">{timeFormat(item.to)}</Label>
                      </div>
                      <Textarea
                        value={item.text}
                        className="overflow-hidden"
                        onChange={(event) => onInputChange("src", index, event.target.value)}
                        onFocus={() => {
                          if (player) player.seek = item.from / 1000
                        }}
                      />
                    </div>
                  )
                })
              }
            </div>
            <div className="flex flex-col space-y-2 w-[300px]">
              {
                editorValues.dst.subtitle.map((item, index) => {
                  return (
                    <div key={`dst-${index}`} className="flex h-full space-x-1">
                      <div className="flex flex-col text-slate-300 py-2">
                        <Label className="text-xs h-full">{timeFormat(item.from)}</Label>
                        <Label className="text-xs">{timeFormat(item.to)}</Label>
                      </div>
                      <Textarea
                        value={item.text}
                        className="overflow-hidden"
                        onChange={(event) => onInputChange("dst", index, event.target.value)}
                        onFocus={() => {
                          if (player) player.seek = item.from / 1000
                        }}
                      />
                    </div>
                  )
                })
              }
            </div>
          </div>
        </ScrollArea>
        <div className="flex flex-col items-center space-y-2">
          <VideoPlayer
            option={{ url: editorValues.src.videoUrl }}
            className="w-[600px] h-[400px] my-1"
            getInstance={(art) => {
              art.on("ready", () => {
                if (!player) setPlayer(art)
              })
            }} >
          </VideoPlayer>
          <Label className="text-lg">{captions.dst}</Label>
          <Label>{captions.src}</Label>
        </div>
      </div>

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
  const srcObj = doc?.srcJson as SubtitleType
  const dstObj = doc?.dstJson as SubtitleType

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
          <SubtitleEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
