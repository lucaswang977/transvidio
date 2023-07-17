import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";
import { getAll } from '@vercel/edge-config';
import type { AppConfig } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type EdgeConfigResponse = { status: string } |
{ error: { code: string, message: string, missingToken: boolean } }

export const configRouter = createTRPCRouter({
  update: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      const headers = new Headers({
        Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      })
      const update = await fetch(
        `https://api.vercel.com/v1/edge-config/${env.VERCEL_EDGE_CONFIG_ID}/items`,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify({
            items: [
              {
                operation: "upsert",
                key: input.key,
                value: input.value
              }
            ]
          })
        }
      )
      const result = await update.json() as EdgeConfigResponse
      if ("error" in result) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: result.error.message
        })
      }
      return result
    }),
  getAll: protectedProcedure.query(async () => {
    if (env.DELAY_ALL_API) await delay(3000)

    const result = await getAll()
    const allConfigs: AppConfig[] = []
    for (const k of Object.keys(result)) {
      allConfigs.push({ key: k, value: result[k] as string })
    }
    return allConfigs
  }),
});
