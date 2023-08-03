"use client"

import * as React from "react"
import { UserNav } from "~/components/user-nav";
import { Logo } from "~/components/logo-with-name"
import { Button } from "~/components/ui/button"
import Link from "next/link";
import { Bot, Download, Loader2, MoreVertical, Save } from "lucide-react";
import { naturalTime } from "~/utils/helper"
import type { DocPermission, DocumentInfo, ProjectAiParamters, SrcOrDst, SubtitleType } from "~/types";
import { Beforeunload } from 'react-beforeunload';
import { useToast } from "~/components/ui/use-toast"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Prisma } from "@prisma/client";
import { ModeToggle } from "~/components/mode-toggle";
import { SubtitleExportDialog } from "~/components/dialogs/subtitle-export-dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export interface EditorComponentProps {
  srcJson: Prisma.JsonValue | undefined,
  dstJson: Prisma.JsonValue | undefined,
  handleChange: HandleChangeInterface,
  permission: DocPermission,
  setAutoFillInit?: (v: boolean) => void
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
    docPermission: DocPermission,
    projectId?: string,
    setAutoFillInit?: (v: boolean) => void
  ) => React.ReactNode
  handleAutoFill?: (aiParams?: ProjectAiParamters) => Promise<void>
}

export const DocumentEditor = (props: DocumentEditorProps) => {
  const [filling, setFilling] = React.useState(false)
  const [saveState, setSaveState] = React.useState<"dirty" | "saving" | "saved">("saved")
  const [abortCtrl, setAbortCtrl] = React.useState(new AbortController())
  const [subtitleExportOpen, setSubtitleExportOpen] = React.useState(false)
  const [history, setHistory] = React.useState<string[]>([])
  const { toast } = useToast()
  const { data: session } = useSession()

  const childrenRef = React.useRef<AutofillHandler | null>(null);
  const [isAutoFillInit, setAutoFillInit] = React.useState(false);

  const mutation = api.document.save.useMutation()
  const [docInfo, setDocInfo] = React.useState<DocumentInfo>(
    { id: "", title: "", type: "ARTICLE", projectId: "", projectName: "", updatedAt: new Date(0) }
  )
  const defaultPermission = {
    srcReadable: false,
    srcWritable: false,
    dstReadable: false,
    dstWritable: false,
  }
  const [permission, setPermission] = React.useState<DocPermission>(defaultPermission)

  const [srcJson, setSrcJson] = React.useState<Prisma.JsonValue | undefined>()
  const [dstJson, setDstJson] = React.useState<Prisma.JsonValue | undefined>()

  const { status } = api.document.load.useQuery(
    { documentId: props.docId },
    {
      enabled: (session?.user !== undefined && props.docId !== undefined && docInfo.id === ""),
      onSuccess: (result) => {
        if (result) {
          const doc = result.doc
          setDocInfo({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            updatedAt: doc.updatedAt,
            projectId: doc.projectId,
            projectName: doc.project.name,
            projectAiParamters: doc.project.aiParameter as ProjectAiParamters
          })

          setPermission(result.permission)
          if (doc.srcJson) setSrcJson(doc.srcJson)
          if (doc.dstJson) setDstJson(doc.dstJson)
        }
      },
      onError: (err) => {
        console.error(err)
      }
    }
  )

  function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return function executedFunction(...args: Parameters<F>): void {
      const later = () => {
        timeout = undefined;
        func(...args);
      };

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }


  const handleChange: HandleChangeInterface = (t, updater) => {
    if (t === "src") setSrcJson(updater)
    else setDstJson(updater)
    setSaveState("dirty")
    setHistory(h => {
      h.push(JSON.stringify({ src: srcJson, dst: dstJson }))
      console.log(srcJson, dstJson, h)
      return [...h]
    })
  }

  function saveDoc() {
    return new Promise<void>(resolve => {
      setSaveState("saving")
      mutation.mutate({
        documentId: props.docId,
        src: permission.srcWritable ? JSON.stringify(srcJson) : undefined,
        dst: JSON.stringify(dstJson)
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
            toast({ title: "Filling canceled." })
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
        <span className="text-gray-400 text-sm">Loading ...</span>
      </div>
      :
      status === "error" ?
        <div className="text-gray-400 h-screen w-full flex justify-center items-center">
          No permission
        </div>
        :
        (session?.user.role !== "ADMIN" && !permission.srcReadable && !permission.dstReadable) ?
          <div className="text-gray-400 h-screen w-full flex justify-center items-center">
            Sorry, you don&apos;t have permission to open the document.
          </div>
          :
          <>
            {saveState !== "saved" && (<Beforeunload onBeforeunload={(event) => event.preventDefault()} />)}
            <main className="flex min-h-screen flex-col">
              <div className="border-b">
                <div className="fixed bg-white dark:bg-black z-100 w-full border-b flex items-center justify-between h-16 px-4">
                  <Link href="/admin"><Logo /></Link>

                  <div className="flex flex-col items-center">
                    <p className="text">{docInfo.title}</p>
                    <p className="text-xs text-gray-400">
                      Saved {naturalTime(docInfo.updatedAt)}
                    </p>
                  </div>

                  <div className="flex space-x-4 items-center">
                    {
                      isAutoFillInit &&
                      <Button
                        disabled={!permission.dstWritable}
                        onClick={filling ? cancelFilling : startFilling} >
                        {filling ?
                          <Loader2 className="w-4 animate-spin mr-1" />
                          : <Bot className="h-4 w-4 mr-1" />
                        }
                        <span>{filling ? "Cancel" : "Auto Fill"}</span>
                      </Button>
                    }
                    <Button
                      disabled={saveState !== "dirty" ||
                        (!permission.srcWritable && !permission.dstWritable)}
                      onClick={async () => {
                        await saveDoc()
                      }} >
                      <Save className="h-4 w-4 mr-1" />
                      <span>{saveState === "saving" ? "Saving" : "Save"}</span>
                    </Button>
                    <Button onClick={() => {
                      const data = history.pop()
                      if (data) {
                        const d = JSON.parse(data) as { src: Prisma.JsonValue, dst: Prisma.JsonValue }
                        setSrcJson(d.src)
                        setDstJson(d.dst)
                      }
                      setHistory([...history])
                    }}>Undo {history.length}</Button>
                    <ModeToggle />
                    <UserNav />
                    {
                      (docInfo.type === "SUBTITLE") &&
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <SubtitleExportDialog
                            srcObj={srcJson as SubtitleType}
                            dstObj={dstJson as SubtitleType}
                            title={docInfo.title}
                            open={subtitleExportOpen}
                            setOpen={setSubtitleExportOpen}
                            trigger={
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Export</span>
                              </>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 pt-16">
                {props.children(
                  srcJson, dstJson,
                  handleChange,
                  childrenRef,
                  permission,
                  docInfo.projectId,
                  setAutoFillInit)}
              </div>
            </main >
          </>
  )
}
