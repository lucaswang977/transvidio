import Image from "next/image"
import { cn } from "~/utils/helper"
import { useTheme } from 'next-themes'
import * as React from "react"
import { Oswald } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400"]
});


export function Logo({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { resolvedTheme } = useTheme()
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => setLoaded(true), []);
  let src

  switch (resolvedTheme) {
    case 'light':
      src = '/img/logo-black.svg'
      break
    case 'dark':
      src = '/img/logo-white.svg'
      break
    default:
      src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      break
  }

  return (
    <>
      {
        loaded &&
        <button className={cn("flex items-center space-x-2", className)}
          {...props}>
          <Image
            src={src}
            loading="lazy"
            alt="Tranvidio"
            width={500} height={500} className="w-8" />
          <p className={cn("text-lg hidden md:block", oswald.className)}>Transvid.io</p>
        </button>
      }
    </>
  )
}
