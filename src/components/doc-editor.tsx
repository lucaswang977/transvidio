"use client"

import * as React from "react"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { Button } from "~/components/ui/button"
import Link from "next/link";
import { Bot, Loader2, Save } from "lucide-react";
import { naturalTime } from "~/utils/helper"
import type { DocumentInfo, ProjectAiParamters, SrcOrDst } from "~/types";
import { Beforeunload } from 'react-beforeunload';
import { useToast } from "~/components/ui/use-toast"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import type { Prisma } from "@prisma/client";

export interface HandleChangeInterface {
  (t: SrcOrDst, v: Prisma.JsonValue | undefined): void
}

export interface AutofillHandler {
  autofillHandler?: (aiParams?: ProjectAiParamters) => void;
}

type DocumentEditorProps = {
  docId: string,
  children: (
    srcObj: Prisma.JsonValue | undefined,
    dstObj: Prisma.JsonValue | undefined,
    handleChange: HandleChangeInterface,
    ref: React.Ref<AutofillHandler | null>,
  ) => React.ReactNode
  handleAutoFill?: (aiParams?: ProjectAiParamters) => Promise<void>
}

export const DocumentEditor = (props: DocumentEditorProps) => {
  const [filling, setFilling] = React.useState(false)
  const [saveState, setSaveState] = React.useState<"dirty" | "saving" | "saved">("saved")
  const childrenRef = React.useRef<AutofillHandler | null>(null);
  const { toast } = useToast()
  const { data: session } = useSession()
  const mutation = api.document.save.useMutation()
  const [docInfo, setDocInfo] = React.useState<DocumentInfo>(
    { id: "", title: "", projectId: "", projectName: "", updatedAt: new Date(0) }
  )

  const [srcObj, setSrcObj] = React.useState<Prisma.JsonValue | undefined>()
  const [dstObj, setDstObj] = React.useState<Prisma.JsonValue | undefined>()

  const { status } = api.document.load.useQuery(
    { documentId: props.docId },
    {
      enabled: (session?.user !== undefined && props.docId !== undefined && docInfo.id === ""),
      onSuccess: (doc) => {
        if (doc) {
          setDocInfo({
            id: doc.id,
            title: doc.title,
            updatedAt: doc.updatedAt,
            projectId: doc.projectId,
            projectName: doc.project.name,
            projectAiParamters: doc.project.aiParameter as ProjectAiParamters
          })

          if (doc.srcJson) setSrcObj(doc.srcJson)
          if (doc.dstJson) setDstObj(doc.dstJson)
        }
      }
    }
  )

  const handleChange: HandleChangeInterface = (t, v) => {
    if (t === "src") setSrcObj(v)
    else setDstObj(v)
    setSaveState("dirty")
  }

  function saveDoc() {
    return new Promise<void>(resolve => {
      setSaveState("saving")
      mutation.mutate({
        documentId: props.docId,
        src: JSON.stringify(srcObj),
        dst: JSON.stringify(dstObj)
      }, {
        onSuccess: (di) => {
          setDocInfo(di)
          resolve()
          setSaveState("saved")
          toast({ title: "Document saved." })
        }
      })
    })
  }


  return (
    status === "loading" ?
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
      :
      <>
        {saveState !== "saved" && (<Beforeunload onBeforeunload={(event) => event.preventDefault()} />)}
        <main className="flex min-h-screen flex-col">
          <div className="border-b">
            <div className="fixed bg-white z-10 w-full border-b flex items-center justify-between h-16 px-4">
              <Link href="/admin"><Logo /></Link>
              <div className="flex flex-col items-center">
                <p className="text">{docInfo.title}</p>
                <p className="text-xs text-gray-400">
                  Saved {naturalTime(docInfo.updatedAt)}
                </p>
              </div>
              <div className="flex space-x-4 items-center">
                {
                  childrenRef.current && childrenRef.current.autofillHandler ?
                    <Button disabled={filling} onClick={() => {
                      const handler = childrenRef.current?.autofillHandler
                      if (handler) {
                        setFilling(true)
                        try {
                          handler(docInfo.projectAiParamters)
                        } finally {
                          setFilling(false)
                        }
                      }
                    }} >
                      {filling ?
                        <Loader2 className="w-4 animate-spin mr-1" />
                        : <Bot className="h-4 w-4 mr-1" />
                      }
                      <span>{filling ? "Filling" : "Auto Fill"}</span>
                    </Button>
                    : <></>
                }
                <Button disabled={saveState !== "dirty"} onClick={async () => {
                  await saveDoc()
                }} >
                  <Save className="h-4 w-4 mr-1" />
                  <span>{saveState === "saving" ? "Saving" : "Save"}</span>
                </Button>
                <UserNav />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4 p-20">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-xl font-bold tracking-tight mx-auto">
                {docInfo?.title ? docInfo.title : "Introduction Editor"}
              </h2>
            </div>
            {props.children(srcObj, dstObj, handleChange, childrenRef)}
          </div>
        </main>

      </>
  )
}
