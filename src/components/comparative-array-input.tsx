import * as React from "react"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import type { SrcOrDst } from "~/types"


type ComparativeArrayEditorProps = {
  src: string[],
  dst: string[],
  onChange: (t: SrcOrDst, v: string[]) => void
}

export const ComparativeArrayEditor = (props: ComparativeArrayEditorProps) => {
  const onChange = (where: SrcOrDst, v: string, index: number) => {
    if (where === "src") {
      const srcArray = [...props.src]
      if (index < 0) srcArray.push(v)
      else srcArray[index] = v
      props.onChange(where, srcArray)
    } else {
      const dstArray = [...props.dst]
      if (index < 0) dstArray.push(v)
      else dstArray[index] = v
      props.onChange(where, dstArray)
    }
  }

  return (
    <>
      {props.src.map((src, index) => {
        const dst = props.dst[index]
        return (<div key={index} className="flex space-x-2 w-full">
          <Input
            type="text"
            value={src ? src : ""}
            onChange={(event) => { onChange("src", event.target.value, index) }} />
          <Input
            type="text"
            value={dst ? dst : ""}
            onChange={(event) => { onChange("dst", event.target.value, index) }} />
        </div>)
      })}
      <Button className="hidden text-gray-200" variant="outline" onClick={() => {
        onChange("src", "", -1)
        onChange("dst", "", -1)
      }}><Plus /></Button>
    </>
  )
}


