import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"
import { DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Download } from "lucide-react";
import { convertToColorCode, timeFormat } from "~/utils/helper"
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
    s.push(`${timeFormat(item.from, true, ",", 3)} --> ${timeFormat(item.to, true, ",", 3)}`)
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
    s.push(`${timeFormat(item.from, true, ".", 3)} --> ${timeFormat(item.to, true, ".", 3)}`)
    s.push(`${item.text}`)

    data.push(s.join("\n"))
  })

  return `WEBVTT\n\n${data.join("\n\n")}`
}

const generateAssString = (obj: SubtitleType, main: boolean) => {
  const convertSize = (size: string) => {
    switch (size) {
      case "text-[10px]": return "40"
      case "text-[11px]": return "44"
      case "text-[12px]": return "48"
      case "text-[13px]": return "52"
      case "text-[14px]": return "56"
      case "text-[15px]": return "60"
      case "text-[16px]": return "64"
      case "text-[17px]": return "68"
      case "text-[18px]": return "72"
      case "text-[19px]": return "76"
      case "text-[20px]": return "80"
      default: return "56"
    }
  }

  const escapeText = (text: string) => {
    return text.replaceAll("\n", "\\N").replaceAll(" ", "\\h")
  }

  const assHeader = `[Script Info]\n Title: Subtitle Example\n ScriptType: v4.00+\n Collisions: Normal\n PlayResX: 1920\n PlayResY: 1080\n Timer: 100.0000\n\n [V4+ Styles]\n Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n Style: Default,Noto Sans CJK SC,56,&H00FFFFFF,&H00000000,&HFF000000,&HFF000000,-1,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n [Events]\n Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`
  const assOnScreenText = obj.ost ? obj.ost.map((item) => {
    let style = `\\an7\\pos(${Math.floor(item.attr.position.x_percent * 1920)},${Math.floor(item.attr.position.y_percent * 1080)})`

    if (item.attr.size) {
      style = `${style}\\fs${convertSize(item.attr.size)}`
    }

    if (item.attr.color || item.attr.opacity) {
      const colors = convertToColorCode(item.attr.color, item.attr.opacity)
      style = `${style}\\1c&H${colors.primaryColorCode}&\\3c&H${colors.borderColorCode}&\\4c&H${colors.shadowColorCode}&`
    }

    return `Dialogue: 0,${timeFormat(item.from, true)},${timeFormat(item.to, true)},Default,,0,0,0,,{${style}}${escapeText(item.text)}`
  }).join("\n")
    : ""
  const assSubtitles = main ? obj.subtitle.map((item) => {
    return `Dialogue: 0,${timeFormat(item.from, true)},${timeFormat(item.to, true)},Default,,0,0,0,,${item.text}`
  }).join("\n")
    : ""

  return `${assHeader}\n${assOnScreenText}\n${assSubtitles}`
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
      <div className="grid grid-cols-4 items-center gap-4">
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
        <div></div>
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
        <Button variant="outline" className="space-x-2" onClick={() => {
          const ass = generateAssString(props.dstObj, false)
          downloadStringAsFile(ass, `${props.title}.translated.ass`)
        }}>
          <Download className="h-4 w-4" />
          <span>ASS</span>
        </Button>

      </div>
    </DropdownMenuDialogItem>
  )
}


