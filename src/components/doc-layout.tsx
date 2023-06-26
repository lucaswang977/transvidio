"use client"

import * as React from "react"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { Button } from "~/components/ui/button"
import Link from "next/link";
import { Bot, Save } from "lucide-react";
import { naturalTime } from "~/utils/helper"
import type { DocumentInfo } from "~/types";
import { Beforeunload } from 'react-beforeunload';

type LayoutProps = {
  docInfo: DocumentInfo,
  saveDisabled: boolean,
  children: React.ReactNode
  handleSave: () => void,
  handleAutoFill?: (projectId: string) => void
}

const DocLayout = (props: LayoutProps) => {

  return (
    <>
      {!props.saveDisabled && (<Beforeunload onBeforeunload={(event) => event.preventDefault()} />)}
      <main className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="fixed bg-white z-10 w-full border-b flex items-center justify-between h-16 px-4">
            <Link href="/admin"><Logo /></Link>
            <div className="flex flex-col items-center">
              <p className="text">{props.docInfo.title}</p>
              <p className="text-xs text-gray-400">
                Saved {naturalTime(props.docInfo.updatedAt)}
              </p>
            </div>
            <div className="flex space-x-4 items-center">
              <Button onClick={() => {
                if (props.handleAutoFill) props.handleAutoFill(props.docInfo.projectId)
              }} >
                <Bot className="h-4 w-4 mr-1" />
                <span>Auto Fill</span>
              </Button>

              <Button disabled={props.saveDisabled} onClick={props.handleSave} >
                <Save className="h-4 w-4 mr-1" />
                <span>Save</span>
              </Button>
              <UserNav />
            </div>
          </div>
        </div>
        {props.children}
      </main>

    </>
  )
}

export default DocLayout 
