// https://www.udemy.com/api-2.0/courses/673654/?fields[course]=
//   title,headline,description,prerequisites,objectives,target_audiences
// {
// "_class": "course",
// "id", 12345,
// "title": "text",
// "headeline": "text",
// "description": "HTML",
// "prerequisites": [text, text],
// "objectives": [text, text],
// "target_audiences": [text, text]
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"

import {
  BtnUndo,
  BtnRedo,
  Separator,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  BtnNumberedList,
  BtnBulletList,
  BtnLink,
  BtnClearFormatting,
  Editor,
  EditorProvider,
  Toolbar
} from 'react-simple-wysiwyg';
import { Plus, Save } from "lucide-react"

type PageSchema = {
  title: string,
  headline: string,
  description: string,
  prerequisites: string[],
  objectives: string[],
  target_audiences: string[]
}

const pageDefaultValue: PageSchema = {
  title: "",
  headline: "",
  description: "",
  prerequisites: [],
  objectives: [],
  target_audiences: []
}

type SrcOrDst = "src" | "dst"

type ComparativeInputProps =
  {
    label: string,
    src: string | undefined,
    dst: string | undefined,
    onChange: (label: string, t: SrcOrDst, v: string) => void
  }

const ComparativeInput = (props: ComparativeInputProps) => {
  const [content, setContent] = React.useState({ src: props.src, dst: props.dst })
  return (
    <div className="flex-col space-y-2">
      <Label>{props.label}</Label>
      <Input
        disabled={true}
        type="text"
        value={content.src}
        onChange={(event) => {
          setContent({ ...content, src: event.target.value })
          props.onChange(props.label, "src", event.target.value)
        }} />
      <Input
        type="text"
        value={content.dst}
        onChange={(event) => {
          setContent({ ...content, dst: event.target.value })
          props.onChange(props.label, "dst", event.target.value)
        }} />
    </div>
  )
}

type CustomHtmlEditorProps = {
  value: string,
  where: SrcOrDst,
  onChange: (where: SrcOrDst, v: string) => void
}

const CustomHtmlEditor = (props: CustomHtmlEditorProps) => {
  return (
    <EditorProvider>
      <Editor
        value={props.value}
        onChange={(event) => props.onChange(props.where, event.target.value)}>
        <Toolbar>
          <BtnUndo />
          <BtnRedo />
          <Separator />
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <BtnStrikeThrough />
          <Separator />
          <BtnNumberedList />
          <BtnBulletList />
          <Separator />
          <BtnLink />
          <BtnClearFormatting />
        </Toolbar>
      </Editor>
    </EditorProvider>
  )
}

type ComparativeHtmlEditorProps = {
  label: string,
  src: string | undefined,
  dst: string | undefined,
  onChange: (label: string, t: SrcOrDst, v: string) => void
}

const ComparativeHtmlEditor = (props: ComparativeHtmlEditorProps) => {
  const [content, setContent] = React.useState({ src: props.src, dst: props.dst })
  const onChange = (where: "src" | "dst", v: string) => {
    if (where === "src") setContent({ ...content, src: v })
    else setContent({ ...content, dst: v })

    props.onChange(props.label, where, v)
  }
  return (
    <div className="flex-col space-y-2 place-items-center">
      <Label>{props.label}</Label>
      <div className="border rounded-lg p-4 text-gray-400"
        dangerouslySetInnerHTML={{ __html: content.src ? content.src : "" }}></div>
      <CustomHtmlEditor value={content.dst ? content.dst : ""} where="dst" onChange={onChange} />
    </div>
  )
}

type ComparativeArrayEditorProps = {
  label: string,
  src: string[],
  dst: string[],
  onChange: (label: string, t: SrcOrDst, v: string) => void
}

const ComparativeArrayEditor = (props: ComparativeArrayEditorProps) => {
  const [content, setContent] = React.useState({ src: props.src, dst: props.dst })
  const onChange = (where: "src" | "dst", v: string, index: number) => {
    if (where === "src") {
      srcArray[index] = v
      setContent({ ...content, src: srcArray })
      const nc = JSON.stringify(srcArray)
      props.onChange(props.label, where, nc)
    } else {
      dstArray[index] = v
      setContent({ ...content, dst: dstArray })
      const nc = JSON.stringify(dstArray)
      props.onChange(props.label, where, nc)
    }
  }
  const srcArray: string[] = content.src
  const dstArray: string[] = content.dst

  return (
    <div className="flex-col space-y-2 place-items-center">
      <Label>{props.label}</Label>
      {srcArray.map((src, index) => {
        const dst = dstArray[index]
        return (<div key={index} className="flex-col space-y-1">
          <Input
            disabled={true}
            type="text"
            value={src}
            onChange={(event) => { onChange("src", event.target.value, index) }} />
          <Input
            type="text"
            value={dst}
            onChange={(event) => { onChange("dst", event.target.value, index) }} />
        </div>)
      })}
      <Button variant="ghost" onClick={() => {
        srcArray.push("")
        dstArray.push("")
        setContent({ src: srcArray, dst: dstArray })
      }}><Plus /></Button>
    </div>
  )
}

type IntroductionEditorProps = {
  docId: string,
  src: PageSchema,
  dst: PageSchema
}

const IntroductionEditor = (props: IntroductionEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  const onInputChange = (label: string, t: "src" | "dst", v: string) => {
    if (t === "src") {
      setEditorValues((values) => {
        return { ...values, src: { ...values.src, [label]: v } }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        return { ...values, dst: { ...values.dst, [label]: v } }
      })
    }
    setContentChanged(true)
  }

  function save() {
    mutation.mutate({
      documentId: props.docId,
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
      <ComparativeInput
        label="title"
        src={editorValues.src.title}
        dst={editorValues.dst.title}
        onChange={onInputChange} />
      <ComparativeInput
        label="headline"
        src={editorValues.src.headline}
        dst={editorValues.dst.headline}
        onChange={onInputChange} />
      <ComparativeHtmlEditor
        label="description"
        src={editorValues.src.description}
        dst={editorValues.dst.description}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="prerequisites"
        src={editorValues.src.prerequisites}
        dst={editorValues.dst.prerequisites}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="objectives"
        src={editorValues.src.objectives}
        dst={editorValues.dst.objectives}
        onChange={onInputChange} />
      <ComparativeArrayEditor
        label="target_audiences"
        src={editorValues.src.target_audiences}
        dst={editorValues.dst.target_audiences}
        onChange={onInputChange} />
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
  let srcObj: PageSchema = doc?.srcJson as PageSchema
  if (srcObj === null) srcObj = pageDefaultValue
  let dstObj: PageSchema = doc?.dstJson as PageSchema
  if (dstObj === null) dstObj = pageDefaultValue
  console.log(srcObj, typeof (srcObj), dstObj, typeof (dstObj))

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
          <IntroductionEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
