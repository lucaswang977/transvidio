import { z } from "zod"
import path from "path"
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server"
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3"
import type { S3ServiceException } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "~/env.mjs"
import { delay } from "~/utils/helper";

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "UPLOAD"

export const uploadRouter = createTRPCRouter({
  signUrl: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      filename: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      if (env.DELAY_ALL_API) await delay(3000)
      await cLog(LogLevels.INFO, LOG_RANGE, `${ctx.session.user.id}`, "signUrl() called")

      const s3 = new S3Client({
        region: env.S3_REGION,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
      })
      const pathname = `${input.projectId}/${env.S3_UPLOAD_FOLDER_NAME}`
      let filename = input.filename

      try {
        const headResult = await s3.send(new HeadObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: `${pathname}/${filename}`
        }))
        const randomStr = Date.now().toString()
        const extname = path.extname(filename)
        const basename = path.basename(filename, extname)
        if (headResult) {
          filename = `${basename}.${randomStr}${extname}`
        }
      } catch (err) {
        if ((err as S3ServiceException).name !== "NotFound") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: (err as S3ServiceException).message
          })
        }
      }
      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: `${pathname}/${filename}`
      })

      const url = await getSignedUrl(s3, command, { expiresIn: 900 }).catch(err => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err as string
        })
      })

      const finalUrl = `${env.CDN_BASE_URL}/${input.projectId}/${env.S3_UPLOAD_FOLDER_NAME}/${filename}`
      await cLog(LogLevels.INFO, LOG_RANGE, `${ctx.session.user.id}`, `signUrl() success: ${input.projectId}, ${input.filename}, ${url}, ${finalUrl}.`)

      return {
        presigned: url,
        finalUrl: finalUrl
      }
    }),
});
