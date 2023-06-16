import * as React from "react"
import Artplayer from 'artplayer';
import { cn } from "~/utils/helper"

export interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  option: { url: string },
  getInstance: (art: Artplayer) => void,
}

function VideoPlayer({ className, ...props }: VideoPlayerProps) {
  const artRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (artRef.current) {
      // Artplayer.DEBUG = true
      const art = new Artplayer({
        ...props.option,
        container: artRef.current
      })
      props.getInstance(art)

      return () => {
        if (art && art.destroy) {
          art.destroy(false)
        }
      }
    }
  }, [])

  return (
    <div
      id="video-player"
      ref={artRef}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}>
    </div>
  )
}

export { VideoPlayer }
