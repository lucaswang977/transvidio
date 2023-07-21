import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { DocumentState, DocumentType, Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server";
import type { DocPermission, DocumentInfo } from "~/types";
import { env } from "~/env.mjs";
import { countWordsInJSONValues, delay } from "~/utils/helper";

const getDocumentAndPermission = async (userId: string, docId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    }
  })

  if (!user || user.blocked) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User invalid."
    })
  }

  const document = await prisma.document.findUnique({
    where: {
      id: docId,
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

  const projectRelation = await prisma.projectsOfUsers.findFirst({
    where: {
      projectId: document.projectId,
      userId: userId,
    }
  })

  const permission = getDocPermission({
    isAdmin: user.role === "ADMIN",
    isInProject: projectRelation !== null,
    isClaimer: document.userId === user.id,
    docType: document.type,
    docState: document.state,
  })

  return { doc: document, permission: permission }
}

const getDocPermission = (cond: {
  isAdmin: boolean,
  isInProject: boolean,
  isClaimer: boolean,
  docType: DocumentType,
  docState: DocumentState,
}) => {
  const defaultPermission = {
    srcReadable: false,
    srcWritable: false,
    dstReadable: false,
    dstWritable: false,
  }

  const np: DocPermission = defaultPermission
  if (cond.isAdmin) {
    np.srcReadable = true
    np.srcWritable = true
    np.dstReadable = true
    np.dstWritable = true
  } else {
    // The doc is only able to be opened when I am in this project.
    if (cond.isInProject) {
      // If I have claimed the doc, I can translate it, but I cannot modify
      // the source content
      if (cond.isClaimer) {
        np.srcReadable = true
        np.dstReadable = true
        np.dstWritable = true
        // Except it is a subtitle type
        if (cond.docType === "SUBTITLE") {
          np.srcWritable = true
        }
      } else {
        // Im in this project but this document is not claimed by me,
        // I can read it if it has been submitted
        if (cond.docState === "REVIEW") {
          np.srcReadable = true
          np.dstReadable = true
        }
      }
    }
  }

  return np
}

export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      pageSize: z.number(),
      pageIndex: z.number(),
      filterByType: z.nativeEnum(DocumentType).optional(),
      filterByState: z.nativeEnum(DocumentState).optional(),
      filterByProject: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      const projects = await ctx.prisma.projectsOfUsers.findMany({
        where: {
          userId: ctx.session.user.id
        }
      })

      let where = undefined
      if (ctx.session.user.role !== "ADMIN") {
        where = {
          type: input.filterByType,
          state: input.filterByState,
          projectId: (input.filterByProject && projects.find(p => p.projectId === input.filterByProject)) ?
            input.filterByProject :
            { in: projects.map((project) => project.projectId) }
        }
      } else {
        where = {
          type: input.filterByType,
          projectId: input.filterByProject,
          state: input.filterByState
        }
      }

      return {
        pagination: {
          pageIndex: input.pageIndex,
          pageSize: input.pageSize,
          total: await ctx.prisma.document.count({ where: where })
        },
        data: await ctx.prisma.document.findMany(
          {
            skip: input.pageSize * input.pageIndex,
            take: input.pageSize,
            orderBy: {
              seq: "asc"
            },
            select: {
              id: true,
              seq: true,
              type: true,
              title: true,
              state: true,
              wordCount: true,
              memo: true,
              createdAt: true,
              updatedAt: true,
              user: { select: { name: true, id: true, image: true } },
              project: { select: { id: true, name: true } }
            },
            where: where
          }

        )
      }
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().nonempty(),
      type: z.nativeEnum(DocumentType),
      projectId: z.string().nonempty(),
      seq: z.number().optional(),
      srcJson: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const result = await prisma.document.create({
        data: {
          title: input.title,
          type: input.type,
          seq: input.seq,
          srcJson: input.srcJson ? (JSON.parse(input.srcJson) as Prisma.JsonObject) : undefined,
          project: {
            connect: {
              id: input.projectId
            }
          },
        }
      })

      return result
    }),

  delete: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const result = await prisma.document.delete({
        where: {
          id: input.documentId,
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
      dst: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const result = await getDocumentAndPermission(
        ctx.session.user.id,
        input.documentId)

      const document = result.doc
      const permission = result.permission

      const docInfo: DocumentInfo = {
        title: document.title,
        updatedAt: document.updatedAt,
        id: document.id,
        type: document.type,
        projectId: document.projectId,
        projectName: document.project.name
      }

      if (input.src !== undefined && permission.srcWritable) {
        const wordCount = countWordsInJSONValues(JSON.parse(input.src))

        const { updatedAt } = await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            srcJson: JSON.parse(input.src) as Prisma.JsonObject,
            wordCount: (wordCount === 0) ? undefined : wordCount
          }
        })
        docInfo.updatedAt = updatedAt
      } else if (input.src !== undefined) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No permission on writing document."
        })
      }

      if (input.dst !== undefined && permission.dstWritable) {
        const { updatedAt } = await prisma.document.update({
          where: {
            id: input.documentId
          },
          data: {
            dstJson: JSON.parse(input.dst) as Prisma.JsonObject
          }
        })
        docInfo.updatedAt = updatedAt
      } else if (input.dst !== undefined) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No permission."
        })
      }

      return docInfo
    }),

  load: protectedProcedure
    .input(z.object({
      documentId: z.string().nonempty(),
    }))
    .query(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      return await getDocumentAndPermission(
        ctx.session.user.id,
        input.documentId)
    }),
});
