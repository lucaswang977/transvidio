import { z } from "zod";
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
    .input(z.object({
      userId: z.string().nonempty(),
    }))
    .query(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, `${ctx.session.user.id}`, "getMyIncome() called.")

      return (await ctx.prisma.incomeRecord.findMany(
        {
          where: {
            userId: input.userId,
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
});
