import * as React from "react"
import ReactPlayer from "react-player"
import type { ReactPlayerProps } from 'react-player'
import { cn, timeFormat } from "~/utils/helper"

import { Button } from "~/components/ui/button"
import { Slider } from "~/components/ui/slider"
import { ArrowBigLeftDash, ArrowBigRightDash, Pause, Play } from "lucide-react"
import type { OnScreenTextAttrType, RelativePositionType } from "~/types"


export interface VideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  url: string,
  width?: string,
  height?: string,
  caption?: string,
  ost?: VideoOstType[],
  handleOstPositionChanged?: (index: number, position: RelativePositionType) => void
  handleProgress: (playedSeconds: number) => void,
}

export type VideoOstType = {
  index: number, text: string, attr: OnScreenTextAttrType
}

const VideoPlayer = React.forwardRef<ReactPlayer, VideoPlayerProps & ReactPlayerProps>(
  ({ className, url, handleProgress, ...props }, ref) => {
    const VIDEO_HEIGHT = 360
    const VIDEO_WIDTH = 640
    const ostWrapperRef = React.useRef<HTMLDivElement>(null)
    const [playing, setPlaying] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [duration, setDuration] = React.useState(-1)
    const ostRefs: React.RefObject<HTMLDivElement>[] = []

    if (props.ost && props.ost.length > 0) {
      props.ost.forEach(() => {
        ostRefs.push(React.createRef())
        console.log(ostRefs)
      })
    }

    const handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      console.log("up: ", ev)
    }

    const handleMouseMove = (ev: MouseEvent) => {
      console.log("move: ", ev)
    }

    const handleMouseDown = (ev: MouseEvent) => {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
      if (ostWrapperRef.current) {
        const videoPos = ostWrapperRef.current.getBoundingClientRect()
        ostRefs.forEach((item) => {
          if (item && item.current) {
            console.log("item: ", item.current.getBoundingClientRect())
          }
        })
        console.log("down: ", ev, videoPos)
      }
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
          <div ref={ostWrapperRef}>
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
          <div id="ost-layer" className="z-10 absolute inset-1 bg-black bg-opacity-0">
            {
              props.ost && props.ost.length > 0 &&
              props.ost.map((item, i) => {
                return (<div
                  key={i}
                  ref={ostRefs[i]}
                  className={cn(
                    "absolute",
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
