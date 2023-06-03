import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server"

import { prisma } from "~/server/db";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const credential = await prisma.credential.findUnique({
        where: {
          email: input.email
        }
      })

      if (credential) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email already registered."
        })
      }

      const result = await prisma.credential.create({
        data: {
          email: input.email,
          pwd: input.password
        }
      })

      return result
    }),
});
