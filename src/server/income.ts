import { prisma } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { get } from '@vercel/edge-config';
import { AppConfigKeys } from "~/utils/helper"

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "INCOME"

export const generateIncomeRecord = async (documentId: string, operateUserId: string) => {
  await cLog(LogLevels.INFO, LOG_RANGE, operateUserId, `generateIncomeRecord() called: ${documentId}.`)

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
    include: {
      project: true,
      user: true
    }
  })

  if (!document) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Document not existed."
    })
  }

  if (!document.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Document not claimed."
    })
  }

  if (document.state !== "CLOSED") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid document state."
    })
  }

  const rec = await prisma.incomeRecord.findFirst({
    where: {
      documentId: documentId
    }
  })

  if (rec) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Duplicated records."
    })
  }

  const docType = document.type
  const rateStr = await get(`${AppConfigKeys.BASIC_COST_PREFIX}${docType}`)
  if (!rateStr) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Rate not configured."
    })
  }

  const rate = parseFloat(rateStr.toString())
  const number = rate * document.wordCount / 1000
  if (number <= 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid word count."
    })
  }

  const result = await prisma.incomeRecord.create({
    data: {
      number: number,
      wordCount: document.wordCount,
      rate: rate,
      userId: document.userId,
      projectId: document.projectId,
      documentId: documentId
    }
  })

  await cLog(LogLevels.INFO, LOG_RANGE, operateUserId, `generateIncomeRecord() success: ${documentId}, ${result.id}.`)
}
