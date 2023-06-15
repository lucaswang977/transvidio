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
import { Download, Folder, Save, Upload } from "lucide-react"
import { Input } from "~/components/ui/input";
import axios, { AxiosResponse } from 'axios';
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";


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

type AttachmentProps =
  {
    where: SrcOrDst,
    fileurl: string,
    projectId: string,
    filename: string,
    onChange: (label: string, t: SrcOrDst, v: string) => void
  }

export const Attachment = (props: AttachmentProps) => {
  const [uploadingFile, setUploadingFile] = React.useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const handleUpload = async () => {
    if (uploadingFile) {
      const formData = new FormData();
      formData.append("projectId", props.projectId)
      formData.append('file', uploadingFile);
      try {
        const response: AxiosResponse<{ location: string }> = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              console.log(progressEvent.loaded, progressEvent.total)
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            }
          },
        });

        props.onChange("fileurl", props.where, response.data.location)
        console.log('File uploaded successfully');
      } catch (error) {
        console.error('Failed to upload file');
      }
    }
  };

  return (
    <div className="flex-col space-y-2">
      {props.fileurl ?
        (<Button>
          <a href={props.fileurl}><Download className="mr-2 h-4 w-4" />Download</a>
        </Button>
        )
        : (
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input multiple={false} type="file" onChange={({ target }) => {
              if (target.files) {
                const file = target.files[0];
                if (file) {
                  setUploadingFile(file)
                }
              }
            }} />
            <Button onClick={handleUpload} disabled={!uploadingFile}>Upload</Button>
            <Label className="text-xs text-gray-500">Note: the maximized size of one file is 100MB.</Label>
          </div>
        )
      }
      {uploadProgress > 0 && (
        <Progress value={uploadProgress} className="w-[60%]" />
      )}
    </div>
  )
}


const AttachmentEditor = (props: AttachmentEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  const [uploadingSrcFile, setUploadingSrcFile] = React.useState<File | null>(null)
  const [uploadingDstFile, setUploadingDstFile] = React.useState<File | null>(null)

  const fileSrcInputRef = React.useRef<HTMLInputElement>(null)
  const fileDstInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (where: SrcOrDst) => {
    let uploadingFile = uploadingDstFile
    let uploadingFilename = editorValues.dst.filename

    if (where === "src" && uploadingSrcFile) {
      uploadingFile = uploadingSrcFile
      uploadingFilename = editorValues.src.filename
    }

    if (uploadingFile) {
      const formData = new FormData();
      formData.append("projectId", props.projectId)
      formData.append("filename", uploadingFilename)
      formData.append('file', uploadingFile);
      try {
        const response: AxiosResponse<{ location: string }> = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              console.log(progressEvent.loaded, progressEvent.total)
            }
          },
        });

        onInputChange("fileurl", where, response.data.location)
        console.log('File uploaded successfully', response.data.location);
      } catch (error) {
        console.error('Failed to upload file');
      }
    }
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
          value={editorValues.src.filename}
          onChange={(event) => {
            onInputChange("filename", "src", event.target.value)
          }} />
        <Button variant="ghost">
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
          value={editorValues.dst.filename}
          onChange={(event) => {
            onInputChange("filename", "dst", event.target.value)
          }} />
        <Button variant="ghost">
          {
            editorValues.dst.fileurl ?
              <a href={editorValues.dst.fileurl}><Download /></a> :
              editorValues.dst.filename ?
                <Upload onClick={() => handleUpload("dst")} /> :
                <Folder onClick={() => {
                  if (fileDstInputRef.current) fileDstInputRef.current.click()
                }} />
          }
        </Button>
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
