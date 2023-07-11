// Convert uploaded files into database records
//
// This is a node script written in Typescript, because we have to 
// import database type definitions.
//
// Run this script like this:
// # dotenv -e .env -- npx tsx scripts/db-import.ts <product id> 

import { env } from "../src/env.mjs"
import { prisma } from "../src/server/db"
import type { Document } from "@prisma/client"
import type {
  Curriculum,
  CurriculumItem,
  CurriculumItemEnum,
  CurriculumSection,
  Introduction,
  QuizType,
  SubtitleType
} from "../src/types"
import { parse } from '@plussub/srt-vtt-parser'

type IntroType = {
  id: number,
  title: string,
  description: string,
  headline: string,
  prerequisites: string[],
  objectives: string[],
  target_audiences: string[]
}

type CurriculumItemType = {
  id: number,
  type: "chapter" | "lecture" | "practice" | "quiz",
  title: string,
  description: string | null,
  quizNum: number | null,
  assetType: "Video" | "Article" | "File" | null,
  assetId: number | null,
  assetTitle: string | null,
  assetTime: string | null,
  supAssetCount: number | null
}

type CurriculumType = CurriculumItemType[]


type SupplementItemType = {
  lectureId: number,
  assetId: number,
  assetType: "Video" | "File" | "Article",
  assetFilename: string
}

type SupplementType = SupplementItemType[]

async function createIntroDoc(projectId: string, intro: IntroType) {
  const data = intro as Introduction

  await prisma.document.create({
    data: {
      seq: 0,
      title: "Course Introduction",
      type: "INTRODUCTION",
      srcJson: data,
      projectId: projectId,
    }
  })

  console.log("Intro doc created.")
}

async function createCurriculum(
  projectId: string,
  curriculum: CurriculumType,
  supplement: SupplementType) {

  const curriculumDoc: Curriculum = {
    sections: []
  }

  let currentSection: CurriculumSection | null = null

  let seq = 1 // intro and curriculum will be 0, 1
  for (const item of curriculum) {
    if (item.type === "chapter") {
      const data: CurriculumSection = {
        index: item.id,
        title: item.title,
        items: []
      }
      currentSection = data
      curriculumDoc.sections.push(data)
      console.log("Record a chapter: ", item.title, item.id)
    } else if (item.type === "practice") {
      // TODO: not supported yet
      console.error("Practice type lecture not supported yet")
    } else if (item.type === "lecture") {
      let dataType: CurriculumItemEnum = "lecture"
      if (item.assetType === "Video") {
        seq = seq + 1
        dataType = "lecture"
        const supItem = supplement.find((si) =>
          si.lectureId === item.id && si.assetId === item.assetId)

        if (supItem && supItem.assetFilename) {
          const originalSubtitleSrcUrl = `${env.CDN_BASE_URL}/${projectId}/${supItem.assetFilename}.src.vtt`
          const srcData: SubtitleType = {
            videoUrl: `${env.CDN_BASE_URL}/${projectId}/${supItem.assetFilename}`,
            subtitle: []
          }
          const respSrc = await fetch(originalSubtitleSrcUrl)
          if (respSrc.ok) {
            const vttText = await respSrc.text()
            const { entries } = parse(vttText)
            srcData.subtitle = entries
          }

          const dstData: SubtitleType = {
            videoUrl: srcData.videoUrl,
            subtitle: srcData.subtitle.map(s => { return { from: s.from, text: "", to: s.to } })
          }

          await prisma.document.create({
            data: {
              seq: seq,
              title: item.title,
              type: "SUBTITLE",
              srcJson: srcData,
              dstJson: dstData,
              projectId: projectId,
            }
          })

          console.log("Create a subtitle doc for: ", item.title, item.id)
        } else {
          console.log("Subtitle doc creation failed: ", item.title, item.id)
        }
      } else if (item.assetType === "Article") {
        seq = seq + 1
        dataType = "article"
        const docResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/${item.assetId}.html`)
        if (docResp.ok) {
          await prisma.document.create({
            data: {
              seq: seq,
              title: item.title,
              type: "ARTICLE",
              srcJson: { html: await docResp.text() },
              projectId: projectId,
            }
          })

          console.log("Create an article doc for: ", item.title, item.id)
        } else {
          console.log("Create article doc failed: ", item.title, item.id)
        }
      } else {
        console.error("Unrecognized assetType: ", item)
      }

      if (item.supAssetCount && item.supAssetCount > 0) {
        const promises: Promise<Document>[] = []
        supplement.forEach((sup) => {
          if (sup.lectureId == item.id) {
            if (sup.assetType === "File") {
              seq = seq + 1
              promises.push(prisma.document.create({
                data: {
                  seq: seq,
                  title: item.title,
                  type: "ATTACHMENT",
                  srcJson: {
                    filename: sup.assetFilename,
                    fileurl: `${env.CDN_BASE_URL}/${projectId}/${sup.assetFilename}`
                  },
                  projectId: projectId,
                }
              }))
              console.log("Create an attachment doc for: ", sup.assetFilename, item.title, item.id)
            }
          }
        })
        await Promise.all(promises)
      }

      const data: CurriculumItem = {
        id: item.id,
        title: item.title,
        item_type: dataType,
        description: item.description ? item.description : ""
      }

      if (currentSection) currentSection.items.push(data)
    } else if (item.type === "quiz") {
      const data: CurriculumItem = {
        id: item.id,
        title: item.title,
        item_type: "quiz",
        description: item.description ? item.description : ""
      }

      const quizResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/quiz_${item.id}.json`)
      if (quizResp.ok) {
        const quizJson = await quizResp.json() as QuizType
        seq = seq + 1
        await prisma.document.create({
          data: {
            seq: seq,
            title: item.title,
            type: "QUIZ",
            srcJson: quizJson,
            projectId: projectId,
          }
        })
        console.log("Create a quiz doc for: ", item.title, item.id)
      } else {
        console.log("Fetching quiz failed. ", item.id)
      }
      if (currentSection) currentSection.items.push(data)
    } else {
      console.log("Unrecognized item type: ", item)
    }
  }

  await prisma.document.create({
    data: {
      seq: 1,
      title: "Course Curriculum",
      type: "CURRICULUM",
      srcJson: curriculumDoc,
      projectId: projectId,
    }
  })

  console.log("Curriculum doc created.")
}

if (process.argv.length < 3) {
  console.log('Please provide the project ID.');
  console.log('Usage: dotenv -e <.env> -- node db-import.js <project-id>');
  process.exit(1);
}

const projectId = process.argv[2];

if (projectId) {
  const introResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/introduction.json`)
  console.log("fetching intro", introResp.ok)
  const curriculumResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/curriculum.json`)
  console.log("fetching curriculum", curriculumResp.ok)
  const supplementResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/supplement.json`)
  console.log("fetching supplement", supplementResp.ok)
  if (introResp.ok && curriculumResp.ok && supplementResp.ok) {
    const intro = await introResp.json()
    const curriculum = await curriculumResp.json()
    const supplement = await supplementResp.json()
    await createIntroDoc(projectId, intro)
    await createCurriculum(projectId, curriculum, supplement)
  }
}
