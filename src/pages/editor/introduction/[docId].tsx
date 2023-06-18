// https://www.udemy.com/api-2.0/courses/673654/?fields[course]=
//   title,headline,description,prerequisites,objectives,target_audiences
// {
// "_class": "course",
// "id", 12345,
// "title": "text",
// "headeline": "text",
// "description": "HTML",
// "prerequisites": [text, text],
// "objectives": [text, text],
// "target_audiences": [text, text]
// }

import { type NextPageWithLayout } from "~/pages/_app"
import { useRouter } from "next/router"
import * as React from "react"
import { api } from "~/utils/api";
import { useSession } from "next-auth/react"
import { equals } from 'ramda';

import {
  ComparativeInput,
} from "~/components/ui/comparatives"

import type { Introduction, SrcOrDst } from "~/types"
import DocLayout from "~/pages/editor/layout";
import { Document, Project } from "@prisma/client";

type EditorValueChangeHandlerType = (t: SrcOrDst, v: Introduction) => void

const DocEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const docId = router.query.docId as string
  const { data: session } = useSession()
  const mutation = api.document.save.useMutation()
  const [contentDirty, setContentDirty] = React.useState(false)
  const [currentDoc, setCurrentDoc] = React.useState<Document & { project: Project; } | null>(null)
  const [editorSrcValues, setEditorSrcValues] = React.useState<Introduction | null>(null)
  const [editorDstValues, setEditorDstValues] = React.useState<Introduction | null>(null)
  const { status } = api.document.load.useQuery(
    { documentId: docId },
    {
      enabled: session?.user !== undefined,
      onSuccess: (doc) => {
        setCurrentDoc(doc)
        // if (doc && doc.srcJson) {
        //   setEditorSrcValues(doc.srcJson as Introduction)
        // }
        //
        // if (doc && doc.dstJson) {
        //   setEditorDstValues(doc.dstJson as Introduction)
        // }
        //
        // if (doc && doc.srcJson && !doc.dstJson) {
        //   setEditorDstValues(cloneDeep(doc.srcJson as Introduction))
        // }
      }
    }
  )

  const onInputChange: EditorValueChangeHandlerType = (t, v) => {
    if (t === "src") {
      if (equals(v, editorSrcValues)) setContentDirty(true)
      setEditorSrcValues(v)
    } else if (t === "dst") {
      if (equals(v, editorDstValues)) setContentDirty(true)
      setEditorDstValues(v)
    }
  }

  function saveDoc() {
    mutation.mutate({
      documentId: docId,
      src: JSON.stringify(editorSrcValues),
      dst: JSON.stringify(editorDstValues)
    })
    setContentDirty(true)
  }


  return (
    <DocLayout
      title={currentDoc?.project.name ? currentDoc.project.name : "Unknown Project"}
      handleSave={saveDoc}
      saveDisabled={!contentDirty}
      docUpdateTime={currentDoc?.updatedAt ? currentDoc.updatedAt : new Date(0)}
    >
      {status === "loading" ? <span>Loading</span> :
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {currentDoc?.title ? currentDoc.title : "Introduction Editor"}
            </h2>
          </div>
          <div className="flex items-center w-full justify-evenly space-y-2">
            <div className="flex-col space-y-2">
              <ComparativeInput
                src={(currentDoc?.srcJson as Introduction).title}
                dst={(currentDoc?.dstJson as Introduction).title}
                onChange={(t, v) => {
                  if (t === "src") {
                    const n = { ...currentDoc?.srcJson as Introduction }
                    n.title = v
                    onInputChange(t, n)
                  } else if (t === "dst") {
                    const n = { ...currentDoc?.dstJson as Introduction }
                    n.title = v
                    onInputChange(t, n)
                  }
                }} />
              {/* <ComparativeInput */}
              {/*   label="headline" */}
              {/*   src={src.headline} */}
              {/*   dst={dst.headline} */}
              {/*   onChange={handleChange} /> */}
              {/* <ComparativeHtmlEditor */}
              {/*   label="description" */}
              {/*   src={src.description} */}
              {/*   dst={dst.description} */}
              {/*   onChange={handleChange} /> */}
              {/* <ComparativeArrayEditor */}
              {/*   label="prerequisites" */}
              {/*   src={src.prerequisites} */}
              {/*   dst={dst.prerequisites} */}
              {/*   onChange={handleChange} /> */}
              {/* <ComparativeArrayEditor */}
              {/*   label="objectives" */}
              {/*   src={src.objectives} */}
              {/*   dst={dst.objectives} */}
              {/*   onChange={handleChange} /> */}
              {/* <ComparativeArrayEditor */}
              {/*   label="target_audiences" */}
              {/*   src={src.target_audiences} */}
              {/*   dst={dst.target_audiences} */}
              {/*   onChange={handleChange} /> */}
            </div>
          </div>
        </div>
      }
    </DocLayout>
  )
}

DocEditorPage.getTitle = () => "Document editor - Transvid.io"

export default DocEditorPage
