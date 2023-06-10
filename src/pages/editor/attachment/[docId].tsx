// {
// "files": [
//    {filename: "abcd.doc", fileurl: "/files/32321321321.doc"},
//    {filename: "kakat.xls", fileurl: "/files/45442313213.xls"}
// ],
// }

import { type NextPage } from "next"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"

import { Button } from "~/components/ui/button"
import { Download, Save } from "lucide-react"
import { ComparativeInput } from "~/components/ui/comparatives"
import { Input } from "~/components/ui/input";
import axios from "axios";


type PageSchema = {
  filename: string,
  fileurl: string,
}

const pageDefaultValue: PageSchema = {
  filename: "",
  fileurl: "",
}

type AttachmentEditorProps = {
  docId: string,
  src: PageSchema,
  dst: PageSchema
}

type SrcOrDst = "src" | "dst"

type AttachmentProps =
  {
    where: SrcOrDst,
    fileurl: string,
    onChange: (label: string, t: SrcOrDst, v: string) => void
  }

export const Attachment = (props: AttachmentProps) => {
  const [uploadingFile, setUploadingFile] =
    React.useState<File | null>(null)

  const handleUpload = async (uploading: File | null) => {
    try {
      if (uploading) {
        const formData = new FormData();
        formData.append("myImage", uploading);
        const { data } = await axios.post("/api/upload",
          formData,
          { headers: { 'content-type': 'multipart/form-data' } }
        );
        console.log(data);
        props.onChange("fileurl", props.where, data.files[0].location)
      }
    } catch (error: any) {
      console.log(error.response?.data);
    }
  };


  return (
    <div className="flex-col space-y-2">
      {props.fileurl ?
        (<Button>
          <a href={props.fileurl}><Download className="mr-2 h-4 w-4" />Download</a>
        </Button>
        )
        : (<div className="grid w-full max-w-sm items-center gap-1.5">
          <Input type="file" onChange={({ target }) => {
            if (target.files) {
              const file = target.files[0];
              if (file) {
                setUploadingFile(file)
              }
            }
          }} />
          <Button onClick={() => handleUpload(uploadingFile)}>Upload</Button>
        </div>)
      }
    </div>
  )
}


const AttachmentEditor = (props: AttachmentEditorProps) => {
  const mutation = api.document.save.useMutation()
  const [editorValues, setEditorValues] = React.useState({ src: props.src, dst: props.dst })
  const [contentChanged, setContentChanged] = React.useState(false)

  const onInputChange = (label: string, t: "src" | "dst", v: any) => {
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
      <ComparativeInput
        label="filename"
        srcEditable={true}
        src={editorValues.src.filename}
        dst={editorValues.dst.filename}
        onChange={onInputChange} />
      <Attachment
        where="src"
        fileurl={editorValues.src.fileurl}
        onChange={onInputChange} />
      <Attachment
        where="dst"
        fileurl={editorValues.dst.fileurl}
        onChange={onInputChange} />
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {doc?.title ? doc.title : "Introduction Editor"}
          </h2>
          <p className="text-sm text-gray-400">saved at {doc?.updatedAt.toLocaleString()}</p>
        </div>
        <div className="flex items-center w-full justify-evenly space-y-2">
          <AttachmentEditor docId={docId} src={srcObj} dst={dstObj} />
        </div>
      </div>
  )
}

export default DocEditor
