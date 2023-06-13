import Image from "next/image"
import { cn } from "~/utils/helper"

export function Logo({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className={cn("flex items-center space-x-2", className)}
      {...props}>
      <Image src="/logo-black.svg" alt="TV" />
      <p>Transvid.io</p>
    </div>
  )
}
