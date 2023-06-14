import Image from "next/image"
import { cn } from "~/utils/helper"

export function Logo({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className={cn("flex items-center space-x-2", className)}
      {...props}>
      <Image src="/logo-black.svg" alt="TV" width={600} height={600} className="w-8" />
      <p>Transvid.io</p>
    </div>
  )
}
