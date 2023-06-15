import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { DocumentType, type Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server";

export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role === "ADMIN") {
        return ctx.prisma.document.findMany({
          include: {
            user: true,
            project: true,
          }
        })
      } else {
        const projects = await ctx.prisma.projectsOfUsers.findMany({
          where: {
            userId: ctx.session.user.id
          }
        })
        return ctx.prisma.document.findMany({
          include: {
            user: true,
            project: true,
          },
          where: {
            projectId: {
              in: projects.map((project) => project.projectId)
            }
          }
        })

      }
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().nonempty(),
      type: z.nativeEnum(DocumentType),
      memo: z.string().optional(),
      projectId: z.string().nonempty()
    }))
    .mutation(async ({ input }) => {
      const result = await prisma.document.create({
        data: {
          title: input.title,
          type: input.type,
          memo: input.memo,
          project: {
            connect: {
              id: input.projectId
            }
          },
        }
      })

      return result
    }),
  claimByUser: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: {
          id: input.documentId,
        }
      })

      if (!document) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not existed."
        })
      }
      if (document.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document already claimed."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          userId: ctx.session.user.id
        }
      })
    }),
  unclaimByUser: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: {
          id: input.documentId,
        }
      })

      if (!document) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not existed."
        })
      }
      if (document.userId != ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not claimed by this user."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          userId: null
        }
      })
    }),
  save: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
      src: z.string().optional(),
      dst: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: {
          id: input.documentId,
        }
      })

      if (!document) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not existed."
        })
      }
      if (ctx.session.user.role !== "ADMIN" && document.userId != ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not claimed by this user."
        })
      }

      if (input.src) {
        await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            dstJson: JSON.parse(input.dst) as Prisma.JsonObject,
            srcJson: JSON.parse(input.src) as Prisma.JsonObject
          }
        })
      } else {
        await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            dstJson: JSON.parse(input.dst) as Prisma.JsonObject
          }
        })
      }
    }),
  load: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .query(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: {
          id: input.documentId,
        }
      })

      if (!document) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not existed."
        })
      }
      if (ctx.session.user.role !== "ADMIN" && document.userId != ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not claimed by this user."
        })
      }
      return prisma.document.findUnique({
        where: {
          id: input.documentId
        },
      })
    }),


});
