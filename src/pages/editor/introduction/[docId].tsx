// https://www.udemy.com/api-2.0/courses/673654/?fields[course]=title,headline,description,prerequisites,objectives,target_audiences
// {
// "_class": "course",
// "id", 12345,
// "title": "text",
// "description": "HTML",
// "headeline": "text",
// "prerequisites": [text, text],
// "objectives": [text, text],
// "target_audiences": [text, text]
// }


import { type NextPage } from "next"
import { useRouter } from "next/router"

const IntroductionEditor: NextPage = () => {
  const router = useRouter()
  const docId = router.query.docId

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Introduction Document Editor</h2>
        <p>Document Id: {docId}</p>
      </div>
    </div>

  )
}

export default IntroductionEditor
