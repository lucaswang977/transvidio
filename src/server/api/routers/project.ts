import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { Language, type Document } from "@prisma/client"
import { TRPCError } from "@trpc/server";
import type {
  Introduction,
  Curriculum,
  CurriculumSection,
  CurriculumItem,
  CurriculumItemEnum,
  SubtitleType,
} from "~/types"
import { env } from "~/env.mjs";
import { type QuizType } from "~/types"

export type ProjectRelatedUser = {
  id: string,
  name: string | null,
  image: string | null
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.project.findMany({
      include: {
        users: {
          select: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        documents: true
      }
    })
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().nonempty(),
      srcLang: z.nativeEnum(Language),
      dstLang: z.nativeEnum(Language),
      memo: z.string()
    }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findFirst({
        where: {
          name: input.name,
          srcLang: input.srcLang,
          dstLang: input.dstLang
        }
      })

      if (project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project duplicated."
        })
      }

      const result = await prisma.project.create({
        data: {
          name: input.name,
          srcLang: input.srcLang,
          dstLang: input.dstLang,
          memo: input.memo
        }
      })

      return result
    }),
  assignUsers: protectedProcedure
    .input(z.object({
      id: z.string().nonempty(),
      users: z.string().array()
    }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.id,
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existed."
        })
      }

      await prisma.projectsOfUsers.deleteMany({
        where: {
          projectId: input.id
        }
      })

      if (input.users.length > 0) {
        await prisma.projectsOfUsers.createMany({
          data: input.users.map((user) => { return { projectId: input.id, userId: user } })
        })
      }
      return input
    }),
  import: protectedProcedure
    .input(z.object({
      id: z.string().nonempty()
    }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.id,
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existe."
        })
      }

      const introResp = await fetch(`${env.CDN_BASE_URL}/${input.id}/introduction.json`)
      console.log("fetching intro", introResp.ok)
      const curriculumResp = await fetch(`${env.CDN_BASE_URL}/${input.id}/curriculum.json`)
      console.log("fetching curriculum", curriculumResp.ok)
      const supplementResp = await fetch(`${env.CDN_BASE_URL}/${input.id}/supplement.json`)
      console.log("fetching supplement", supplementResp.ok)
      if (introResp.ok && curriculumResp.ok && supplementResp.ok) {
        const intro = await introResp.json() as IntroType
        const curriculum = await curriculumResp.json() as CurriculumType
        const supplement = await supplementResp.json() as SupplementType
        await createIntroDoc(input.id, intro)
        await createCurriculum(input.id, intro.title, curriculum, supplement)
        return { result: "ok" }
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project data incomplete."
        })
      }
    }),
});

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
  const data: Introduction = intro as Introduction

  const result = await prisma.document.create({
    data: {
      title: intro.title,
      type: "INTRODUCTION",
      srcJson: data,
      projectId: projectId,
    }
  })

  console.log("Intro doc created: ", result)
}

async function createCurriculum(
  projectId: string,
  title: string,
  curriculum: CurriculumType,
  supplement: SupplementType) {

  const curriculumDoc: Curriculum = {
    sections: []
  }

  let currentSection: CurriculumSection | null = null

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
        dataType = "lecture"
        const supItem = supplement.find((si) =>
          si.lectureId === item.id && si.assetId === item.assetId)

        if (supItem && supItem.assetFilename) {
          const srcData: SubtitleType = {
            videoUrl: `${env.CDN_BASE_URL}/${projectId}/${supItem.assetFilename}`,
            originalSubtitleUrl: `${env.CDN_BASE_URL}/${projectId}/${supItem.assetFilename}.src.vtt`,
            subtitle: []
          }

          const dstData: SubtitleType = {
            videoUrl: srcData.videoUrl,
            originalSubtitleUrl: `${env.CDN_BASE_URL}/${projectId}/${supItem.assetFilename}.dst.vtt`,
            subtitle: []
          }
          const result = await prisma.document.create({
            data: {
              title: item.title,
              type: "SUBTITLE",
              srcJson: srcData,
              dstJson: dstData,
              projectId: projectId,
            }
          })

          console.log("Create a subtitle doc for: ", item.title, item.id, result)
        } else {
          console.log("Subtitle doc creation failed: ", item.title, item.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Lecture video not found."
          })
        }
      } else if (item.assetType === "Article") {
        dataType = "article"
        const docResp = await fetch(`${env.CDN_BASE_URL}/${projectId}/${item.id}.html`)
        if (docResp.ok) {
          await prisma.document.create({
            data: {
              title: item.title,
              type: "DOC",
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
              promises.push(prisma.document.create({
                data: {
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
        await prisma.document.create({
          data: {
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

  const result = await prisma.document.create({
    data: {
      title: title,
      type: "CURRICULUM",
      srcJson: curriculumDoc,
      projectId: projectId,
    }
  })

  console.log("Curriculum doc created: ", result)
}


