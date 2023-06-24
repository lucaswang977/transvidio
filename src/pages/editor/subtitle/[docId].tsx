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
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";

import { VideoPlayer } from "~/components/ui/video-player"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import type { SubtitleType, SrcOrDst, DocumentInfo } from "~/types"
import { ScrollArea } from "~/components/ui/scroll-area"

import { timeFormat } from "~/utils/helper"
import type { NextPageWithLayout } from "~/pages/_app"
import DocLayout from "~/components/doc-layout"
import type ReactPlayer from "react-player";

type SubtitleEditorProps = {
  srcObj: SubtitleType,
  dstObj: SubtitleType,
  onChange: (t: SrcOrDst, v: SubtitleType) => void
}

const SubtitleEditor = ({ srcObj, dstObj, onChange }: SubtitleEditorProps) => {
  const reactPlayerRef = React.useRef<ReactPlayer>(null);
  const [captions, setCaptions] = React.useState({ src: "", dst: "" })

  return (
    <div className="flex flex-col items-center lg:items-start lg:flex-row lg:space-x-2 lg:py-6">
      <div className="flex flex-col items-center space-y-2 mb-4 lg:order-last lg:mx-4">
        <VideoPlayer
          url={srcObj.videoUrl}
          ref={reactPlayerRef}
          handleProgress={(playedSeconds: number) => {
            console.log("played: ", playedSeconds)
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
        <Label className="text-lg">{captions.dst}</Label>
        <Label>{captions.src}</Label>
      </div>

      <ScrollArea className="h-[50vh] lg:h-[80vh]">
        <div className="flex">
          <div className="flex flex-col space-y-2">
            {
              srcObj.subtitle.map((item, index) => {
                return (
                  <div key={`src-${index}`} className="flex space-x-1">
                    <div className="flex flex-col text-slate-300 py-2">
                      <Label className="text-xs h-full">{timeFormat(item.from)}</Label>
                      <Label className="text-xs">{timeFormat(item.to)}</Label>
                    </div>
                    <Textarea
                      value={item.text}
                      className="overflow-hidden w-72"
                      onChange={(event) => {
                        const subtitles = [...srcObj.subtitle]
                        const subtitle = subtitles[index]
                        if (subtitle) {
                          subtitle.text = event.target.value
                          onChange("src", { ...srcObj, subtitle: subtitles })
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
              dstObj.subtitle.map((item, index) => {
                return (
                  <div key={`dst-${index}`} className="flex space-x-1">
                    <Textarea
                      value={item.text}
                      className="overflow-hidden w-72"
                      onChange={(event) => {
                        const subtitles = [...dstObj.subtitle]
                        const subtitle = subtitles[index]
                        if (subtitle) {
                          subtitle.text = event.target.value
                          onChange("dst", { ...dstObj, subtitle: subtitles })
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
        </div>
      </ScrollArea>
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
  const defaultSubtitleValue: SubtitleType = {
    videoUrl: "",
    subtitle: []
  }
  const [srcObj, setSrcObj] = React.useState(defaultSubtitleValue)
  const [dstObj, setDstObj] = React.useState(defaultSubtitleValue)

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
          if (doc.srcJson) setSrcObj(doc.srcJson as SubtitleType)
          if (doc.dstJson) {
            const obj = doc.dstJson as SubtitleType
            if (obj.subtitle.length === 0) {
              obj.subtitle = (doc.srcJson as SubtitleType).subtitle.map(i => { return { ...i, text: "" } })
            }
            setDstObj(obj)
          } else {
            const obj = doc.srcJson as SubtitleType
            obj.subtitle.forEach(i => i.text = "")
            setDstObj(obj)
          }
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
        <div className="flex flex-col items-center space-y-4 pt-20">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight mx-auto">
              {docInfo?.title ? docInfo.title : "Curriculum Editor"}
            </h2>
          </div>
          <SubtitleEditor srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
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
