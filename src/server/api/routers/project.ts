import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { Language, type Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server";
import { delay } from "~/utils/helper";
import { env } from "~/env.mjs";
import { type ProjectAiParamters } from "~/types";

export type ProjectRelatedUser = {
  id: string,
  name: string | null,
  image: string | null
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)

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
          select: { state: true }
        }
      },
      where: whereCondition
    }).then(projects => projects.map(project => ({
      ...project,
      documents: project.documents.reduce((acc: Record<string, number>, document) => {
        acc[document.state] = (acc[document.state] || 0) + 1
        acc["ALL"] = (acc["ALL"] || 0) + 1
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
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

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
      if (env.DELAY_ALL_API) await delay(3000)

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

  saveAiParams: protectedProcedure
    .input(z.object({
      projectId: z.string().nonempty(),
      value: z.string().nonempty()
    }))
    .mutation(async ({ input }) => {
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

      return updatedProject.id
    }),
});
