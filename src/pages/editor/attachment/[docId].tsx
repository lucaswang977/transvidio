// {
//   filename: "abcd.doc", 
//   fileurl: "/files/32321321321.doc",
// }

import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Download, Folder, Trash, Upload } from "lucide-react"
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { NextPageWithLayout } from "~/pages/_app";
import type { AttachmentType, DocumentInfo } from "~/types";
import DocLayout from "~/components/doc-layout";

type AttachmentEditorProps = {
  projectId: string,
  srcObj: AttachmentType,
  dstObj: AttachmentType,
  onChange: (t: SrcOrDst, v: AttachmentType) => void
}

type SrcOrDst = "src" | "dst"

const AttachmentEditor = ({ projectId, srcObj, dstObj, onChange }: AttachmentEditorProps) => {
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const [uploadingSrcFile, setUploadingSrcFile] = React.useState<File | null>(null)
  const [uploadingDstFile, setUploadingDstFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const mutation = api.upload.signUrl.useMutation()

  const fileSrcInputRef = React.useRef<HTMLInputElement>(null)
  const fileDstInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = () => {
    if (!uploadingSrcFile && !uploadingDstFile) {
      console.log("No uploading file selected.")
      return
    }

    let uploadingFile = uploadingDstFile
    let uploadingFilename = dstObj.filename
    let where: SrcOrDst = "dst"

    setUploading(true)

    if (uploadingSrcFile) {
      uploadingFile = uploadingSrcFile
      uploadingFilename = srcObj.filename
      where = "src"
    }

    if (uploadingFile) {
      mutation.mutate({
        projectId: projectId,
        filename: uploadingFilename
      }, {
        onSuccess: (async ({ presigned, finalUrl }) => {
          if (uploadingFile) {
            const buffer = await uploadingFile.arrayBuffer();
            const result = await new Promise<boolean>((resolve,) => {
              const xhr = new XMLHttpRequest();

              xhr.upload.onprogress = (event: ProgressEvent) => {
                setUploadProgress(Math.floor(event.loaded / event.total * 100));
              };

              xhr.open('PUT', presigned, true);
              xhr.setRequestHeader('Content-Type',
                uploadingFile ? uploadingFile.type : "application/octet-stream");
              xhr.setRequestHeader('Cache-Control', 'max-age=630720000');

              xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(true)
                  } else {
                    resolve(false)
                  }
                }
              };

              xhr.send(buffer);
            }).catch(err => {
              console.log("File upload failed: ", err)
            });
            if (result) {
              onChange(where, {
                ...(where === "src" ? srcObj : dstObj),
                fileurl: finalUrl
              })
            } else {
              console.log("File upload failed: ")
            }
            setUploading(false)
            setUploadingSrcFile(null)
            setUploadingDstFile(null)
          }
        }),
        onError: (err => {
          console.log(err)
          setUploading(false)
          setUploadingSrcFile(null)
          setUploadingDstFile(null)
        })
      })
    }
  }

  return (
    <div className="flex-col space-y-2">
      <Label>Filename</Label>
      <div className="flex">
        <Input
          type="text"
          disabled={true}
          value={srcObj.filename}
          onChange={(event) => {
            onChange("src", { ...srcObj, filename: event.target.value })
          }} />
        <Button disabled={uploading} variant="ghost">
          {
            srcObj.fileurl ?
              <a target="_blank" href={srcObj.fileurl}><Download /></a> :
              <Upload />
          }
        </Button>
        <input
          type="file"
          className="hidden"
          multiple={false}
          ref={fileSrcInputRef}
          onChange={({ target }) => {
            if (target.files) {
              const file = target.files[0];
              if (file) {
                setUploadingSrcFile(file)
                onChange("src", { ...srcObj, filename: file.name })
              }
            }
          }} />

      </div>

      <div className="flex">
        <Input
          type="text"
          disabled={true}
          value={dstObj.filename}
          onChange={(event) => {
            onChange("dst", { ...dstObj, filename: event.target.value })
          }} />
        <Button disabled={uploading} variant="ghost">
          {
            dstObj.fileurl ?
              <a target="_blank" href={dstObj.fileurl}><Download /></a>
              :
              <Folder onClick={() => {
                if (fileDstInputRef.current) fileDstInputRef.current.click()
              }} />
          }
        </Button>
        {
          dstObj.fileurl ?
            <Button variant="ghost" onClick={() => {
              onChange("dst", { filename: "", fileurl: "" })
            }}>
              <Trash />
            </Button> : <></>
        }
        <input
          type="file"
          className="hidden"
          multiple={false}
          ref={fileDstInputRef}
          onChange={({ target }) => {
            if (target.files) {
              const file = target.files[0];
              if (file) {
                setUploadingDstFile(file)
                onChange("dst", { ...dstObj, filename: file.name })
              }
            }
          }} />
      </div>
      {(uploadingSrcFile || uploadingDstFile) ?
        <div className="flex flex-col space-y-1">
          <Button disabled={uploading} className="w-full" onClick={handleUpload}>
            {uploading ? ((uploadProgress < 100) ? `${uploadProgress}%` : "Waiting") : "Upload"}
          </Button>
          <p className="text-xs text-gray-400">Once uploaded, click the Save button before leaving.</p>
        </div>
        : <></>}
    </div>
  )
}

const DocEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const mutation = api.document.save.useMutation()
  const [contentDirty, setContentDirty] = React.useState(false)
  const [docInfo, setDocInfo] = React.useState<DocumentInfo>(
    { id: "", title: "", projectId: "", projectName: "", updatedAt: new Date(0) }
  )

  const defaultAttachmentValue: AttachmentType = {
    filename: "",
    fileurl: "",
  }

  const [srcObj, setSrcObj] = React.useState(defaultAttachmentValue)
  const [dstObj, setDstObj] = React.useState(defaultAttachmentValue)

  const { status } = api.document.load.useQuery(
    { documentId: docId },
    {
      enabled: (session?.user !== undefined && docId !== undefined && docInfo.id === ""),
      onSuccess: (doc) => {
        if (doc) {
          setDocInfo({
            id: doc.id,
            title: doc.title,
            updatedAt: doc.updatedAt,
            projectId: doc.projectId,
            projectName: doc.project.name,
          })

          if (doc.srcJson) setSrcObj(doc.srcJson as AttachmentType)
          if (doc.dstJson) setDstObj(doc.dstJson as AttachmentType)
        }
      }
    }
  )

  function saveDoc() {
    mutation.mutate({
      documentId: docId,
      src: JSON.stringify(srcObj),
      dst: JSON.stringify(dstObj)
    }, {
      onSuccess: (di) => {
        setDocInfo(di)
      }
    })
    setContentDirty(false)
  }

  return (
    <DocLayout
      docInfo={docInfo}
      handleSave={saveDoc}
      saveDisabled={!contentDirty}
    >
      {status === "loading" ? <span>Loading</span> :
        <div className="flex flex-col items-center space-y-4 p-20">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight mx-auto">
              {docInfo?.title ? docInfo.title : "Introduction Editor"}
            </h2>
          </div>
          <AttachmentEditor
            projectId={docInfo.projectId}
            srcObj={srcObj} dstObj={dstObj} onChange={(t, v) => {
              if (t === "src") setSrcObj(v)
              else setDstObj(v)
              setContentDirty(true)
            }} />
        </div>
      }
    </DocLayout>
  )
}

DocEditorPage.getTitle = () => "Document editor - Transvid.io"

export default DocEditorPage
