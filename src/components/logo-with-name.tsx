import Image from "next/image"
import { cn } from "~/utils/helper"
import { useTheme } from 'next-themes'

export function Logo({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { theme } = useTheme()
  return (
    <button className={cn("flex items-center space-x-2", className)}
      {...props}>
      <Image
        src={theme === "dark" ? "/img/logo-white.svg" : "/img/logo-black.svg"}
        alt="Tranvidio"
        loading="lazy"
        width={500} height={500} className="w-8" />
      <p>Transvid.io</p>
    </button>
  )
}
