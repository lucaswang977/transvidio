import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server"

import { prisma } from "~/server/db";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string(),
      name: z.string(),
      password: z.string()
    }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
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
          pwd: input.password
        }
      })

      return result
    }),
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
});
