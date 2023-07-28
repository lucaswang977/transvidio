import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "INCOME"

export const incomeRouter = createTRPCRouter({
  getMyIncome: protectedProcedure
    .query(async ({ ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, "getMyIncome() called.")

      return (await ctx.prisma.incomeRecord.findMany(
        {
          where: {
            userId: ctx.session.user.id,
          },
          orderBy: {
            createdAt: "desc"
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
                type: true
              }
            },
            payoutRecord: {
              select: {
                id: true
              }
            }
          }
        }
      ))
    }),

  getMyPayouts: protectedProcedure
    .query(async ({ ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, "getAllPayouts() called.")

      return (await ctx.prisma.payoutRecord.findMany(
        {
          where: {
            userId: ctx.session.user.id,
          },
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
    }),


  getAllPayouts: protectedProcedure
    .query(async ({ ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, "getAllPayouts() called.")

      return (await ctx.prisma.payoutRecord.findMany(
        {
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
    }),
});
