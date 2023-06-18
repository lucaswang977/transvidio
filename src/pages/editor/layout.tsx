import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { Button } from "~/components/ui/button"
import Link from "next/link";
import { Save } from "lucide-react";
import { naturalTime } from "~/utils/helper"

type LayoutProps = {
  title: string,
  handleSave: () => void,
  saveDisabled: boolean,
  docUpdateTime: Date,
  children: React.ReactNode
}

const DocLayout = (props: LayoutProps) => {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/"><Logo /></Link>
          <p>{props.title}</p>
          <Button className="w-10 rounded-full p-0 z-20"
            disabled={props.saveDisabled} onClick={props.handleSave} >
            <Save className="h-4 w-4" />
            <span className="sr-only">Save</span>
          </Button>
          <p className="text-sm text-gray-400">
            saved {naturalTime(props.docUpdateTime)}
          </p>
          <UserNav />
        </div>
      </div>
      {props.children}
    </main>
  )
}

export default DocLayout 
