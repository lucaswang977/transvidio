import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { ProjectStatus, Language, type Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server";
import { delay } from "~/utils/helper";
import { env } from "~/env.mjs";
import type { ProjectAiParamters } from "~/types";

import { cLog, LogLevels } from "~/utils/helper"
import { generatePayoutRecord } from "~/server/income";
const LOG_RANGE = "PROJECT"

export type ProjectRelatedUser = {
  id: string,
  name: string | null,
  image: string | null
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)

    await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, "getAll() is called.")

    let whereCondition: Prisma.ProjectWhereInput = {}

    if (ctx.session.user.role !== "ADMIN") {
      whereCondition = {
        users: {
          some: {
            userId: ctx.session.user.id
          }
        }
      }
    }

    return ctx.prisma.project.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        users: {
          select: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        documents: {
          select: {
            state: true,
            wordCount: true,
          }
        }
      },
      where: whereCondition
    }).then(projects => projects.map(project => ({
      ...project,
      documents: project.documents.reduce((acc: Record<string, number>, document) => {
        acc[document.state] = (acc[document.state] || 0) + 1
        acc["ALL"] = (acc["ALL"] || 0) + 1
        acc["WORD_COUNT"] = (acc["WORD_COUNT"] || 0) + document.wordCount
        return acc
      }, {}),
    })))
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().nonempty(),
      srcLang: z.nativeEnum(Language),
      dstLang: z.nativeEnum(Language),
      memo: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `create() is called: ${input.name}, ${input.srcLang}-${input.dstLang}.`)

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

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `create() success: ${input.name}, ${input.srcLang}-${input.dstLang}.`)
      return result
    }),

  assignUsers: protectedProcedure
    .input(z.object({
      id: z.string().nonempty(),
      users: z.string().array()
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `assignUsers() called: ${input.id}, ${input.users.join(",")}.`)
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

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `assignUsers() success: ${input.id}, ${input.users.join(",")}.`)
      return input
    }),

  saveAiParams: protectedProcedure
    .input(z.object({
      projectId: z.string().nonempty(),
      value: z.string().nonempty()
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `saveAiParams() called: ${input.projectId}.`)
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existed."
        })
      }

      const objVal = JSON.parse(input.value) as ProjectAiParamters
      if (!objVal) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Value invalid."
        })
      }

      const updatedProject = await prisma.project.update({
        where: {
          id: input.projectId
        },
        data: {
          aiParameter: objVal
        }
      })

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `saveAiParams() success: ${input.projectId}.`)
      return updatedProject.id
    }),

  changeStatus: protectedProcedure
    .input(z.object({
      projectId: z.string().nonempty(),
      value: z.nativeEnum(ProjectStatus)
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `changeStatus() called: ${input.projectId}, ${input.value}.`)
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
        },
        include: {
          documents: {
            select: { state: true }
          }
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existed."
        })
      }

      if (input.value === "COMPLETED") {
        const res = project.documents.find(i => i.state !== "CLOSED")
        if (res) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not all of the documents are closed."
          })
        }

        await generatePayoutRecord(input.projectId, ctx.session.user.id)
      }

      const updatedProject = await prisma.project.update({
        where: {
          id: input.projectId
        },
        data: {
          status: input.value
        }
      })

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `changeStatus() success: ${input.projectId}.`)
      return updatedProject.id
    }),
});
