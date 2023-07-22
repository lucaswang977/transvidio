import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Download } from "lucide-react";
import { timeFormat } from "~/utils/helper"
import type { SubtitleType } from "~/types";

type SubtitleExportDialogProps = {
  trigger: JSX.Element,
  open: boolean,
  setOpen: (open: boolean) => void,
  title: string,
  srcObj: SubtitleType,
  dstObj: SubtitleType,
  disabled?: boolean,
}

const generateSrtString = (obj: SubtitleType) => {
  const data: string[] = []
  obj.subtitle.map((item, index) => {
    const s = []
    s.push(`${index + 1}`)
    s.push(`${timeFormat(item.from, true, ",")} --> ${timeFormat(item.to, true, ",")}`)
    s.push(`${item.text}`)

    data.push(s.join("\n"))
  })

  return data.join("\n\n")

}

const generateVttString = (obj: SubtitleType) => {
  const data: string[] = []
  obj.subtitle.map((item, index) => {
    const s = []
    s.push(`${index + 1}`)
    s.push(`${timeFormat(item.from, true)} --> ${timeFormat(item.to, true)}`)
    s.push(`${item.text}`)

    data.push(s.join("\n"))
  })

  return `WEBVTT\n\n${data.join("\n\n")}`
}

function downloadStringAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}


export const SubtitleExportDialog = (props: SubtitleExportDialogProps) => {
  return (
    <DropdownMenuDialogItem
      onOpenChange={props.setOpen}
      open={props.open}
      disabled={props.disabled}
      triggerChildren={props.trigger}>
      <DialogHeader>
        <DialogTitle>Subtitle export</DialogTitle>
        <Separator className="my-6" />
      </DialogHeader>
      <div className="grid grid-cols-3 items-center gap-4">
        <p>Source</p>
        <Button variant="outline" className="space-x-2" onClick={() => {
          const vtt = generateVttString(props.srcObj)
          downloadStringAsFile(vtt, `${props.title}.src.vtt`)
        }}>
          <Download className="h-4 w-4" />
          <span>VTT</span>
        </Button>
        <Button variant="outline" className="space-x-2" onClick={() => {
          const srt = generateSrtString(props.srcObj)
          downloadStringAsFile(srt, `${props.title}.src.srt`)
        }}>
          <Download className="h-4 w-4" />
          <span>SRT</span>
        </Button>
        <p>Translated</p>
        <Button variant="outline" className="space-x-2" onClick={() => {
          const vtt = generateVttString(props.dstObj)
          downloadStringAsFile(vtt, `${props.title}.translated.vtt`)
        }}>
          <Download className="h-4 w-4" />
          <span>VTT</span>
        </Button>
        <Button variant="outline" className="space-x-2" onClick={() => {
          const srt = generateSrtString(props.dstObj)
          downloadStringAsFile(srt, `${props.title}.translated.srt`)
        }}>
          <Download className="h-4 w-4" />
          <span>SRT</span>
        </Button>
      </div>
    </DropdownMenuDialogItem>
  )
}


