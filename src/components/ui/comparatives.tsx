import * as React from "react"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"

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
import { Plus } from "lucide-react"


type SrcOrDst = "src" | "dst"

type ComparativeInputProps =
  {
    label: string,
    src: string | undefined,
    dst: string | undefined,
    onChange: (label: string, t: SrcOrDst, v: string) => void
  }

export const ComparativeInput = (props: ComparativeInputProps) => {
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

export const CustomHtmlEditor = (props: CustomHtmlEditorProps) => {
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

export const ComparativeHtmlEditor = (props: ComparativeHtmlEditorProps) => {
  const [content, setContent] = React.useState({ src: props.src, dst: props.dst })
  const onChange = (where: "src" | "dst", v: string) => {
    if (where === "src") setContent({ ...content, src: v })
    else setContent({ ...content, dst: v })

    props.onChange(props.label, where, v)
  }
  return (
    <div className="flex-col space-y-2 place-items-center">
      <Label>{props.label}</Label>
      <div className="border rounded-lg p-4"
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

export const ComparativeArrayEditor = (props: ComparativeArrayEditorProps) => {
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


