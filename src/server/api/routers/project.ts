import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { Language } from "@prisma/client"
import { TRPCError } from "@trpc/server";

export type ProjectRelatedUser = {
  id: string,
  name: string | null,
  image: string | null
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    if (ctx.session.user.role === "ADMIN") {
      return ctx.prisma.project.findMany({
        include: {
          users: {
            select: {
              user: { select: { id: true, name: true, image: true } }
            }
          },
          documents: true
        },
      })
    } else {
      return ctx.prisma.project.findMany({
        include: {
          users: {
            select: {
              user: { select: { id: true, name: true, image: true } }
            }
          },
          documents: true
        },
        where: {
          users: {
            some: {
              userId: ctx.session.user.id
            }
          }
        }
      })
    }
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
});
