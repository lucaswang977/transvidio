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
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Prisma } from "@prisma/client";

export interface EditorComponentProps {
  srcJson: Prisma.JsonValue | undefined,
  dstJson: Prisma.JsonValue | undefined,
  handleChange: HandleChangeInterface
}

export interface HandleChangeInterface {
  (t: SrcOrDst, updater: React.SetStateAction<Prisma.JsonValue | undefined>): void
}

export interface AutofillHandler {
  autofillHandler?: (aiParams?: ProjectAiParamters, abortCtrl?: AbortSignal) => Promise<void>;
}

export const handleTranslate = async (
  aiParams: ProjectAiParamters,
  text: string,
  callback: (output: string) => void,
  abortSignal?: AbortSignal,
) => {
  if (abortSignal && abortSignal.aborted) {
    throw new Error(abortSignal.reason as string)
  }

  const reqBody = JSON.stringify({
    translate: text,
    character: aiParams.character,
    background: aiParams.background,
    syllabus: aiParams.syllabus,
  })

  return fetchEventSource(`/api/translate`, {
    method: 'POST',
    body: reqBody,
    headers: { 'Content-Type': 'application/json' },
    onmessage(ev) {
      callback(ev.data)
    },
    signal: abortSignal
  });
}


type DocumentEditorProps = {
  docId: string,
  children: (
    srcObj: Prisma.JsonValue | undefined,
    dstObj: Prisma.JsonValue | undefined,
    handleChange: HandleChangeInterface,
    ref: React.Ref<AutofillHandler | null>,
    projectId?: string,
  ) => React.ReactNode
  handleAutoFill?: (aiParams?: ProjectAiParamters) => Promise<void>
}

export const DocumentEditor = (props: DocumentEditorProps) => {
  const [filling, setFilling] = React.useState(false)
  const [saveState, setSaveState] = React.useState<"dirty" | "saving" | "saved">("saved")
  const [abortCtrl, setAbortCtrl] = React.useState(new AbortController())
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

  const handleChange: HandleChangeInterface = (t, updater) => {
    if (t === "src") setSrcObj(updater)
    else setDstObj(updater)
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

  const startFilling = async () => {
    const handler = childrenRef.current?.autofillHandler
    if (handler) {
      setFilling(true)
      await handler(docInfo.projectAiParamters, abortCtrl.signal)
        .catch(err => {
          if ((err as Error).message === "UserClickedAbort") {
            toast({ title: "Fill aborted." })
          }
        })
        .finally(() => {
          setFilling(false)
        })
    }
  }

  const cancelFilling = () => {
    abortCtrl.abort("UserClickedAbort")
    setAbortCtrl(new AbortController())
  }

  return (
    status === "loading" ?
      <div className="w-full h-screen flex flex-col justify-center items-center space-y-2">
        <Loader2 className="animate-spin" />
        <span className="text-gray-400 text-sm">Loading document...</span>
      </div>
      :
      <>
        {saveState !== "saved" && (<Beforeunload onBeforeunload={(event) => event.preventDefault()} />)}
        <main className="flex min-h-screen flex-col">
          <div className="border-b">
            <div className="fixed bg-white z-100 w-full border-b flex items-center justify-between h-16 px-4">
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
                    <Button onClick={filling ? cancelFilling : startFilling} >
                      {filling ?
                        <Loader2 className="w-4 animate-spin mr-1" />
                        : <Bot className="h-4 w-4 mr-1" />
                      }
                      <span>{filling ? "Cancel filling" : "Auto Fill"}</span>
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
            {props.children(srcObj, dstObj, handleChange, childrenRef, docInfo.projectId)}
          </div>
        </main>
      </>
  )
}
