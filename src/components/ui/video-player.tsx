import * as React from "react"
import ReactPlayer, { type ReactPlayerProps } from 'react-player'
import { cn } from "~/utils/helper"

export interface VideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  url: string,
  width?: string,
  height?: string,
  handleProgress: (playedSeconds: number) => void,
}

const VideoPlayer = React.forwardRef<ReactPlayer, VideoPlayerProps & ReactPlayerProps>(
  ({ className, url, handleProgress, ...props }, ref) => (
    <ReactPlayer
      className={cn(
        "border p-1",
        className
      )}
      ref={ref}
      url={url}
      progressInterval={100}
      onProgress={(state) => handleProgress(state.playedSeconds)}
      controls={true}
      {...props}
    >
    </ReactPlayer>
  ))

VideoPlayer.displayName = "VideoPlayer"

export { VideoPlayer }
