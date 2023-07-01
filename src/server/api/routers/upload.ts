import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "~/env.mjs"
import { delay } from "~/utils/helper";

export const uploadRouter = createTRPCRouter({
  signUrl: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      filename: z.string()
    }))
    .mutation(async ({ input }) => {
      if (env.DELAY_ALL_API) await delay(3000)

      const s3 = new S3Client({
        region: env.S3_REGION,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
      })
      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: `${input.projectId}/${env.S3_UPLOAD_FOLDER_NAME}/${input.filename}`
      })

      const url = await getSignedUrl(s3, command, { expiresIn: 900 }).catch(err => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err as string
        })
      })
      return {
        presigned: url,
        finalUrl: `${env.CDN_BASE_URL}/${input.projectId}/${env.S3_UPLOAD_FOLDER_NAME}/${input.filename}`
      }
    }),
});
