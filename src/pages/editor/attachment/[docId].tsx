// {
//   filename: "abcd.doc", 
//   fileurl: "/files/32321321321.doc",
// }

import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";

import { Button } from "~/components/ui/button"
import { Download, Folder, Trash, Upload } from "lucide-react"
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { NextPageWithLayout } from "~/pages/_app";
import type { AttachmentType, SrcOrDst } from "~/types";
import {
  type AutofillHandler,
  DocumentEditor,
  type EditorComponentProps
} from "~/components/doc-editor";

const AttachmentEditor = React.forwardRef<AutofillHandler | null,
  EditorComponentProps & { projectId?: string }>(
    ({ srcJson, dstJson, handleChange, permission, projectId }) => {
      const [uploadProgress, setUploadProgress] = React.useState(0);
      const defaultValue: AttachmentType = {
        filename: "",
        fileurl: "",
      }

      let srcObj = defaultValue
      let dstObj = defaultValue
      if (srcJson) srcObj = srcJson as AttachmentType
      if (dstJson) dstObj = dstJson as AttachmentType

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

        if (uploadingFile && projectId) {
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
                  handleChange(where, {
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
                handleChange("src", { ...srcObj, filename: event.target.value })
              }} />
            {
              srcObj.fileurl ?
                <Button variant="ghost">
                  <a target="_blank" href={srcObj.fileurl}><Download /></a>
                </Button>
                :
                <Button disabled={uploading || !permission.srcWritable} variant="ghost">
                  <Upload />
                </Button>
            }
            <input
              disabled={!permission.srcWritable}
              type="file"
              className="hidden"
              multiple={false}
              ref={fileSrcInputRef}
              onChange={({ target }) => {
                if (target.files) {
                  const file = target.files[0];
                  if (file) {
                    setUploadingSrcFile(file)
                    handleChange("src", { ...srcObj, filename: file.name })
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
                handleChange("dst", { ...dstObj, filename: event.target.value })
              }} />
            <Button disabled={uploading || !permission.dstWritable} variant="ghost">
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
                <Button
                  disabled={!permission.dstWritable}
                  variant="ghost" onClick={() => {
                    handleChange("dst", { filename: "", fileurl: "" })
                  }}>
                  <Trash />
                </Button> : <></>
            }
            <input
              disabled={!permission.dstWritable}
              type="file"
              className="hidden"
              multiple={false}
              ref={fileDstInputRef}
              onChange={({ target }) => {
                if (target.files) {
                  const file = target.files[0];
                  if (file) {
                    setUploadingDstFile(file)
                    handleChange("dst", { ...dstObj, filename: file.name })
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
    })

AttachmentEditor.displayName = "AttachmentEditor"

const AttachmentEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string

  return (
    <DocumentEditor
      docId={docId} >
      {(srcJson, dstJson, handleChange, childrenRef, permission, projectId) => {
        return <AttachmentEditor
          srcJson={srcJson}
          dstJson={dstJson}
          projectId={projectId}
          permission={permission}
          handleChange={handleChange}
          ref={childrenRef}
        />
      }}
    </DocumentEditor >
  )
}

AttachmentEditorPage.getTitle = () => "Document editor - Transvid.io"

export default AttachmentEditorPage
