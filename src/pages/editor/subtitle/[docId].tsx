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

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import { parse } from '@plussub/srt-vtt-parser';

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Save } from "lucide-react"
import { SubtitleType, SubtitleItem, SrcOrDst } from "~/types"
import { useQuery } from '@tanstack/react-query'

const pageDefaultValue: SubtitleType = {
  videoUrl: "",
  originalSubtitleUrl: "",
  subtitle: []
}

type SubtitleEditorProps = {
  docId: string,
  src: SubtitleType,
  dst: SubtitleType
}

const SubtitleEditor = (props: SubtitleEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)
  const result = useQuery({
    queryKey: ["vttLoading"], queryFn: async () => {
      let result = { src: false, dst: false }
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
              id: item.id,
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
        if (values.src.subtitle) (values.dst.subtitle[i] as SubtitleItem).text = v
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

  return (
    <div className="flex-col space-y-2">
      <Button className="fixed right-6 bottom-6 w-10 rounded-full p-0 z-20"
        disabled={!contentChanged} onClick={() => save()} >
        <Save className="h-4 w-4" />
        <span className="sr-only">Save</span>
      </Button>
      <div className="flex space-x-2">
        <div className="flex-col space-y-2 w-[300px]">
          {
            editorValues.src.subtitle.map((item, index) => {
              return (
                <div key={item.id} className="flex items-center space-x-1">
                  <Label>{item.id}</Label>
                  <Textarea
                    value={item.text}
                    onChange={(event) => onInputChange("src", index, event.target.value)}
                  />
                </div>
              )
            })
          }
        </div>
        <div className="flex-col space-y-2 w-[300px]">
          {
            editorValues.dst.subtitle.map((item, index) => {
              return (
                <div key={item.id} className="flex items-center space-x-1">
                  <Label>{item.id}</Label>
                  <Textarea
                    value={item.text}
                    onChange={(event) => onInputChange("dst", index, event.target.value)}
                  />
                </div>
              )
            })
          }
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
  let srcObj = doc?.srcJson as SubtitleType
  if (srcObj === null) srcObj = pageDefaultValue
  let dstObj = doc?.dstJson as SubtitleType
  if (dstObj === null) dstObj = pageDefaultValue

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
