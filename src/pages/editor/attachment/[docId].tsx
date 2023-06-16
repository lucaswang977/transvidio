// {
//   filename: "abcd.doc", 
//   fileurl: "/files/32321321321.doc",
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Download, Folder, Trash, Save, Upload } from "lucide-react"
import { Input } from "~/components/ui/input";
import axios, { type AxiosResponse } from 'axios';
import { Label } from "~/components/ui/label";


type PageSchema = {
  filename: string,
  fileurl: string,
}

const pageDefaultValue: PageSchema = {
  filename: "",
  fileurl: "",
}

type AttachmentEditorProps = {
  projectId: string,
  docId: string,
  src: PageSchema,
  dst: PageSchema
}

type SrcOrDst = "src" | "dst"

const AttachmentEditor = (props: AttachmentEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const [uploadingSrcFile, setUploadingSrcFile] = React.useState<File | null>(null)
  const [uploadingDstFile, setUploadingDstFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)

  const fileSrcInputRef = React.useRef<HTMLInputElement>(null)
  const fileDstInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!uploadingSrcFile && !uploadingDstFile) {
      console.log("No uploading file selected.")
      return
    }

    let uploadingFile = uploadingDstFile
    let uploadingFilename = editorValues.dst.filename
    let where: SrcOrDst = "dst"

    setUploading(true)

    if (uploadingSrcFile) {
      uploadingFile = uploadingSrcFile
      uploadingFilename = editorValues.src.filename
      where = "src"
    }

    if (uploadingFile) {
      const formData = new FormData();
      formData.append("projectId", props.projectId)
      formData.append("filename", uploadingFilename)
      formData.append('file', uploadingFile);
      try {
        const response: AxiosResponse<{ location: string }[]> = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            }
          },
        });

        if (response.data[0]) {
          onInputChange("fileurl", where, response.data[0].location)
          console.log('File uploaded successfully', response);
        } else {
          console.log('File uploading failed.', response);
        }
      } catch (error) {
        console.error('Failed to upload file', error);
      }
    }

    setUploading(false)
    setUploadingSrcFile(null)
    setUploadingDstFile(null)
  };

  console.log(editorValues)

  const onInputChange = (label: string, t: "src" | "dst", v: string) => {
    if (t === "src") {
      setEditorValues((values) => {
        return { ...values, src: { ...values.src, [label]: v } }
      })
    } else if (t === "dst") {
      setEditorValues((values) => {
        return { ...values, dst: { ...values.dst, [label]: v } }
      })
    }
    setContentChanged(true)
  }

  function save() {
    mutation.mutate({
      documentId: props.docId,
      src: JSON.stringify({ filename: editorValues.src.filename, fileurl: editorValues.src.fileurl }),
      dst: JSON.stringify({ filename: editorValues.dst.filename, fileurl: editorValues.dst.fileurl })
    })
    setContentChanged(false)
  }


  return (
    <div className="flex-col space-y-2">
      <Button className="fixed right-6 bottom-6 w-10 rounded-full p-0 z-20"
        disabled={!contentChanged} onClick={() => save()} >
        <Save className="h-4 w-4" />
        <span className="sr-only">Save</span>
      </Button>
      <Label>Filename</Label>
      <div className="flex">
        <Input
          type="text"
          disabled={true}
          value={editorValues.src.filename}
          onChange={(event) => {
            onInputChange("filename", "src", event.target.value)
          }} />
        <Button disabled={uploading} variant="ghost">
          {
            editorValues.src.fileurl ?
              <a href={editorValues.src.fileurl}><Download /></a> :
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
                onInputChange("filename", "src", file.name)
              }
            }
          }} />

      </div>

      <div className="flex">
        <Input
          type="text"
          disabled={true}
          value={editorValues.dst.filename}
          onChange={(event) => {
            onInputChange("filename", "dst", event.target.value)
          }} />
        <Button disabled={uploading} variant="ghost">
          {
            editorValues.dst.fileurl ?
              <a href={editorValues.dst.fileurl}><Download /></a>
              :
              <Folder onClick={() => {
                if (fileDstInputRef.current) fileDstInputRef.current.click()
              }} />
          }
        </Button>
        {
          editorValues.dst.fileurl ?
            <Button variant="ghost" onClick={() => {
              onInputChange("filename", "dst", "")
              onInputChange("fileurl", "dst", "")
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
                onInputChange("filename", "dst", file.name)
              }
            }
          }} />
      </div>
      {(uploadingSrcFile || uploadingDstFile) ?
        <Button disabled={uploading} className="w-full" onClick={handleUpload}>
          {uploading ? ((uploadProgress < 100) ? `${uploadProgress}%` : "Wait for url") : "Upload"}
        </Button> : <></>}
    </div>
  )
}

const DocEditor: NextPage = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const { data: doc, status } = api.document.load.useQuery(
    { documentId: docId },
    { enabled: session?.user !== undefined }
  )
  let srcObj: PageSchema = doc?.srcJson as PageSchema
  if (srcObj === null) srcObj = pageDefaultValue
  let dstObj: PageSchema = doc?.dstJson as PageSchema
  if (dstObj === null) dstObj = pageDefaultValue

  return (
    status === "loading" ? <span>Loading</span> :
      doc?.projectId ?
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {doc?.title ? doc.title : "Introduction Editor"}
            </h2>
            <p className="text-sm text-gray-400">saved at {doc?.updatedAt.toLocaleString()}</p>
          </div>
          <div className="flex items-center w-full justify-evenly space-y-2">
            <AttachmentEditor projectId={doc.projectId} docId={docId} src={srcObj} dst={dstObj} />
          </div>
        </div>
        : <div>Document loading failed.</div>
  )
}

export default DocEditor
