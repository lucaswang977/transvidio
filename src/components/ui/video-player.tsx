import * as React from "react"
import ReactPlayer, { type ReactPlayerProps } from 'react-player'
import { cn } from "~/utils/helper"

export interface VideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  url: string,
  handleProgress: (playedSeconds: number) => void,
}

const VideoPlayer = React.forwardRef<ReactPlayer, VideoPlayerProps & ReactPlayerProps>(
  ({ className, url, handleProgress, ...props }, ref) => (
    <ReactPlayer
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
