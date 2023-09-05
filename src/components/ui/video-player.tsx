import * as React from "react"
import ReactPlayer from "react-player"
import type { ReactPlayerProps } from 'react-player'
import { cn, timeFormat } from "~/utils/helper"

import { Button } from "~/components/ui/button"
import { Slider } from "~/components/ui/slider"
import { ArrowBigLeftDash, ArrowBigRightDash, Pause, Play } from "lucide-react"
import type { OnScreenTextAttrType, RelativePositionType } from "~/types"
import { clone } from "ramda"


export interface VideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  url: string,
  width?: string,
  height?: string,
  caption?: string,
  ost?: VideoOstType[],
  handleOstPosChanged?: (index: number, position: RelativePositionType) => void,
  handleProgress: (playedSeconds: number) => void,
}

export type VideoOstType = {
  index: number, text: string, attr: OnScreenTextAttrType
}

const isInBound = (clientX: number, clientY: number, componentRect: DOMRect) => {
  return (
    clientX >= componentRect.left &&
    clientX <= componentRect.right &&
    clientY >= componentRect.top &&
    clientY <= componentRect.bottom
  )
}

type DndStateType = {
  state: "idle" | "dragging",
  index: number,
  initDPos: { x: number, y: number }
}

const defaultDndStateValue: DndStateType = {
  state: "idle",
  index: 0,
  initDPos: { x: 0, y: 0 }
}

const VideoPlayer = React.forwardRef<ReactPlayer, VideoPlayerProps & ReactPlayerProps>(
  ({ className, url, handleProgress, handleOstPosChanged, ...props }, ref) => {
    const VIDEO_HEIGHT = 360
    const VIDEO_WIDTH = 640
    const ostWrapperRef = React.useRef<HTMLDivElement>(null)
    const dndState = React.useRef<DndStateType>(clone(defaultDndStateValue))
    const [playing, setPlaying] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [duration, setDuration] = React.useState(-1)

    const handleMouseUp = (_ev: MouseEvent) => {
      dndState.current = clone(defaultDndStateValue)
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      console.log(dndState.current)
    }

    const handleMouseMove = (ev: MouseEvent) => {
      const normToPercent = (n: number) => {
        if (n < 0) return 0
        if (n > 1) return 1

        return n
      }
      if (dndState.current.state === "dragging") {
        if (handleOstPosChanged && ostWrapperRef.current) {
          const rect = ostWrapperRef.current.getBoundingClientRect()

          handleOstPosChanged(dndState.current.index,
            {
              x_percent: normToPercent((ev.clientX - dndState.current.initDPos.x - rect.x) / VIDEO_WIDTH),
              y_percent: normToPercent((ev.clientY - dndState.current.initDPos.y - rect.y) / VIDEO_HEIGHT)
            })
        }
      }
    }

    const handleMouseDown = (ev: MouseEvent) => {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);

      if (ostWrapperRef.current && dndState.current.state === "idle") {
        const nodes = ostWrapperRef.current.querySelectorAll("div.ost")
        console.log(nodes)
        nodes.forEach(item => {
          const rect = item.getBoundingClientRect()
          if (isInBound(ev.clientX, ev.clientY, rect)) {
            dndState.current.state = "dragging"
            dndState.current.index = parseInt(item.id)
            dndState.current.initDPos = { x: ev.clientX - rect.x, y: ev.clientY - rect.y }
          }
        })
      }
      console.log(dndState.current)
    }

    React.useEffect(() => {
      if (!playing && props.ost && props.ost.length > 0) {
        window.addEventListener("mousedown", handleMouseDown);
        return () => {
          window.removeEventListener("mousedown", handleMouseDown);
        }
      }
    }, [playing])

    return (
      <div className={cn("flex flex-col space-y-1", className)}>
        <div className="relative p-1 border rounded">
          <div>
            <ReactPlayer
              ref={ref}
              url={url}
              controls={false}
              style={{ border: 0, padding: 0 }}
              height={VIDEO_HEIGHT}
              width={VIDEO_WIDTH}
              playing={playing}
              progressInterval={100}
              onDuration={(duration) => { setDuration(duration) }}
              onProgress={(state) => {
                const p = state.playedSeconds / duration
                setProgress(p >= 0 ? p : 0)
                handleProgress(state.playedSeconds)
              }}
              onPlay={() => { setPlaying(true) }}
              onPause={() => { setPlaying(false) }}
              {...props}
            >
            </ReactPlayer>
          </div>
          <div ref={ostWrapperRef} className="z-10 absolute inset-1 bg-black bg-opacity-0">
            {
              props.ost && props.ost.length > 0 &&
              props.ost.map((item, i) => {
                return (<div
                  key={i}
                  id={`${item.index}`}
                  className={cn(
                    "ost",
                    "absolute select-none",
                    item.attr.color ?? "text-white",
                    !playing ? "cursor-pointer" : "cursor-default")}
                  style={{
                    transform: `translate(${item.attr.position.x_percent * VIDEO_WIDTH}px, ${item.attr.position.y_percent * VIDEO_HEIGHT}px)`,
                  }}
                >{item.text}</div>)
              })
            }
          </div>
          <div className="z-5 absolute inset-1 bg-opacity-0 flex justify-center items-end">
            {
              props.caption &&
              <div className="text-white text-sm mb-4 bg-black bg-opacity-40 py-1 px-2">
                {props.caption}
              </div>
            }
          </div>
        </div>
        <div className="p-1 border w-full rounded flex flex-col space-y-2">
          <div className="flex space-x-2 p-2">
            <p className="text-xs"> {timeFormat(progress * duration * 1000)} </p>
            <Slider
              className="px-4 cursor-pointer w-4/5"
              value={[progress]}
              onValueChange={(v) => {
                if (v[0]) {
                  setProgress(v[0])
                  if (ref) {
                    (ref as { current: ReactPlayer }).current.seekTo(v[0], "fraction")
                  }
                }
              }}
              max={1}
              step={0.001} />
            <p className="text-xs"> {timeFormat(duration * 1000)} </p>
          </div>
          <div className="flex space-x-1 items-center justify-center pb-2">
            <Button
              onClick={() => {
                let pos = duration * progress - 0.1
                if (pos < 0) pos = 0
                else if (pos > duration) pos = duration
                if (ref) {
                  (ref as { current: ReactPlayer }).current.seekTo(pos)
                }
              }}
              size="icon"
              variant="outline">
              <ArrowBigLeftDash className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => { setPlaying(!playing) }}
              size="icon"
              variant="outline">
              {!playing ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => {
                let pos = duration * progress + 0.1
                if (pos < 0) pos = 0
                else if (pos > duration) pos = duration
                if (ref) {
                  (ref as { current: ReactPlayer }).current.seekTo(pos)
                }
              }}
              size="icon"
              variant="outline">
              <ArrowBigRightDash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

VideoPlayer.displayName = "VideoPlayer"

export { VideoPlayer }
