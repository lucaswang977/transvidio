import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server"

import { prisma } from "~/server/db";
import bcrypt from "bcryptjs"
import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string(),
      name: z.string(),
      password: z.string()
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const user = await prisma.user.findFirst({
        where: {
          email: input.email
        }
      })

      if (user) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email already registered."
        })
      }

      const result = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          pwd: await bcrypt.hash(input.password, 10)
        }
      })

      if (result) return true
      else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User creating failed."
        })
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)

    return (await ctx.prisma.user.findMany()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ emailVerified, pwd, updatedAt, ...rest }) => rest)
  }),
});
