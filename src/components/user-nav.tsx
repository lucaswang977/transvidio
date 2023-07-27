import * as React from "react"
import { CreditCard, LogOut, Settings2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

import { signOut, useSession } from "next-auth/react"
import { extractLetters } from "~/utils/helper"
import AppConfigDialog from "~/components/dialogs/app-config-dialog"
import { UserIncomeDialog } from "~/components/dialogs/income-dialog"
import { UserProfileDialog } from "~/components/dialogs/user-profile"

export function UserNav() {
  const { data: sessionData } = useSession()
  const [configOpen, setConfigOpen] = React.useState(false)
  const user = {
    name: "",
    image: "",
    role: "editor"
  }

  if (sessionData && sessionData.user) {
    if (sessionData.user.name) user.name = sessionData.user.name
    if (sessionData.user.image) user.image = sessionData.user.image
    if (sessionData.user.role) user.role = sessionData.user.role
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{extractLetters(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{sessionData?.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role.toLowerCase()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {
          sessionData?.user.role === "ADMIN" &&
          <>
            <DropdownMenuGroup>
              <AppConfigDialog
                open={configOpen}
                setOpen={setConfigOpen}
                trigger={
                  <>
                    <Settings2 className="mr-2 h-4 w-4" />
                    <span>Config</span>
                  </>
                }
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        }
        <DropdownMenuGroup>
          <UserProfileDialog
            trigger={
              <>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </>
            } />
          <UserIncomeDialog
            trigger={
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Income</span>
              </>
            } />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
