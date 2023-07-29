import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { z } from "zod";
import { delay } from "~/utils/helper";

import type { Prisma } from "@prisma/client"
import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "INCOME"

export const incomeRouter = createTRPCRouter({
  getMyIncome: protectedProcedure
    .input(z.object({
      payoutId: z.string().optional(),
      userId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, `getMyIncome() called: ${input.payoutId as string}, ${input.userId as string}`)

      let whereCondition: Prisma.IncomeRecordWhereInput = {}
      const userId = input.userId ?
        (ctx.session.user.role === "ADMIN" || input.userId === ctx.session.user.id ? input.userId : ctx.session.user.id)
        : ctx.session.user.id

      if (input.payoutId) {
        whereCondition = {
          payoutRecordId: input.payoutId,
          userId: userId,
        }
      } else {
        whereCondition = {
          userId: userId,
        }
      }

      const result = await ctx.prisma.incomeRecord.findMany(
        {
          where: whereCondition,
          orderBy: {
            createdAt: "asc"
          },
          include: {
            project: {
              select: {
                name: true
              }
            },
            document: {
              select: {
                title: true,
                type: true,
                seq: true,
              }
            },
            payoutRecord: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      )

      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, `getMyIncome() success: ${result.length}`)
      return result
    }),

  getMyPayouts: protectedProcedure
    .query(async ({ ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, "getMyPayouts() called.")

      let whereCondition: Prisma.PayoutRecordWhereInput = {}

      if (ctx.session.user.role !== "ADMIN") {
        whereCondition = {
          userId: ctx.session.user.id
        }
      }

      const result = (await ctx.prisma.payoutRecord.findMany(
        {
          where: whereCondition,
          orderBy: {
            createdAt: "desc"
          },
          include: {
            project: {
              select: { id: true, name: true }
            },
            user: {
              select: { id: true, name: true, image: true }
            },
            incomeRecords: true
          }
        }
      ))

      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, `getMyPayouts() success:${result.length}`)
      return result
    }),

});
