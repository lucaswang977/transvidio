import { cn } from "~/utils/helper"

export function Logo({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className={cn("flex items-center space-x-2", className)}
      {...props}>
      <img src="/logo-black.svg" />
      <p>Transvid.io</p>
    </div>
  )
}
