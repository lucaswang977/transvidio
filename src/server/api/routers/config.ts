import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { env } from "~/env.mjs";
import { delay } from "~/utils/helper";
import { getAll } from '@vercel/edge-config';
import type { AppConfig } from "~/types";
import { TRPCError } from "@trpc/server";

type EdgeConfigResponse = { status: string } |
{ error: { code: string, message: string, missingToken: boolean } }

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "CONFIG"

export const configRouter = createTRPCRouter({
  update: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `update() called: ${input.key}, ${input.value}.`)

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
      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `update() success: ${input.key}, ${input.value}.`)

      return result
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)
    await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() called.`)

    const result = await getAll()
    const allConfigs: AppConfig[] = []
    for (const k of Object.keys(result)) {
      allConfigs.push({ key: k, value: result[k] as string })
    }

    await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() success: ${JSON.stringify(allConfigs)}.`)
    return allConfigs
  }),
});
