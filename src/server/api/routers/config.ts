import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { env } from "~/env.mjs";
import { AppConfigKeys, delay, getAllConfigs, getConfigByKey } from "~/utils/helper";
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
    }).array())
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `update() called: ${JSON.stringify(input)}.`)

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
            items:
              input.map(i => {
                return {
                  operation: "upsert",
                  key: env.NODE_ENV === "development" ? `${AppConfigKeys.DEV_ENV_PREFIX}${i.key}` : i.key,
                  value: i.value
                }
              })
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
      await cLog(LogLevels.INFO, LOG_RANGE, ctx.session.user.id, `update() success.`)

      return result
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (env.DELAY_ALL_API) await delay(3000)
    await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() called.`)

    const allConfigs = await getAllConfigs()

    await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() success: ${JSON.stringify(allConfigs)}.`)
    return allConfigs
  }),

  get: protectedProcedure
    .input(z.object({
      key: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() called: ${input.key}`)
      const value = await getConfigByKey(input.key)
      await cLog(LogLevels.DEBUG, LOG_RANGE, ctx.session.user.id, `getAll() success: ${value as string}`)
      return value
    }),
});
