import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { DocumentType, Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server";
import type { DocumentInfo } from "~/types";
import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";

export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      if (ctx.session.user.role === "ADMIN") {
        return ctx.prisma.document.findMany({
          orderBy: {
            seq: "asc"
          },
          select: {
            id: true,
            seq: true,
            type: true,
            title: true,
            state: true,
            memo: true,
            createdAt: true,
            updatedAt: true,
            user: true,
            project: true
          }
        })
      } else {
        const projects = await ctx.prisma.projectsOfUsers.findMany({
          where: {
            userId: ctx.session.user.id
          }
        })
        return ctx.prisma.document.findMany({
          orderBy: {
            seq: "asc"
          },
          where: {
            projectId: {
              in: projects.map((project) => project.projectId)
            }
          },
          select: {
            id: true,
            seq: true,
            type: true,
            title: true,
            state: true,
            memo: true,
            createdAt: true,
            updatedAt: true,
            user: true,
            project: true
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
      if (env.DELAY_ALL_API) await delay(3000)

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
      if (env.DELAY_ALL_API) await delay(3000)

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

      if (document.state != "OPEN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The state of this document is invalid."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          userId: ctx.session.user.id,
          state: "WORKING"
        }
      })
    }),

  unclaimByUser: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

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
      if (document.state != "WORKING") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The state of this document is invalid."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          userId: null,
          state: "OPEN"
        }
      })
    }),

  submitByUser: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

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
      if (!document.userId || document.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document not claimed by this user."
        })
      }

      if (document.state !== "WORKING") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document state is invalid."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          state: "REVIEW"
        }
      })
    }),

  closeByAdmin: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

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
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin can close the document."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          state: "CLOSED"
        }
      })
    }),
  resetByAdmin: protectedProcedure
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
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin can close the document."
        })
      }

      await prisma.document.update({
        where: {
          id: input.documentId
        },
        data: {
          state: "OPEN",
          dstJson: Prisma.DbNull,
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
      if (env.DELAY_ALL_API) await delay(3000)

      const document = await prisma.document.findFirst({
        where: {
          id: input.documentId,
        },
        include: {
          project: true
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

      const docInfo: DocumentInfo = {
        title: document.title,
        updatedAt: document.updatedAt,
        id: document.id,
        projectId: document.projectId,
        projectName: document.project.name
      }

      if (input.src) {
        const { updatedAt } = await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            dstJson: JSON.parse(input.dst) as Prisma.JsonObject,
            srcJson: JSON.parse(input.src) as Prisma.JsonObject
          }
        })
        docInfo.updatedAt = updatedAt
      } else {
        const { updatedAt } = await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            dstJson: JSON.parse(input.dst) as Prisma.JsonObject
          }
        })
        docInfo.updatedAt = updatedAt
      }

      return docInfo
    }),

  load: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .query(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

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
        include: {
          project: true
        }
      })
    }),
});
