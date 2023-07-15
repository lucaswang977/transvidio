import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";

export const configRouter = createTRPCRouter({
  update: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const value = await prisma.appConfig.findUnique({
        where: {
          key: input.key
        }
      })

      if (value) {
        const result = await prisma.appConfig.update({
          data: {
            value: input.value,
          },
          where: {
            key: input.key
          }
        })
        return result
      } else {
        const result = await prisma.appConfig.create({
          data: {
            key: input.key,
            value: input.value,
          }
        })
        return result
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)

    const result = await ctx.prisma.appConfig.findMany()
    return result
  }),
});
