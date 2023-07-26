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

export const generatePayoutRecord = async (projectId: string, operateUserId: string) => {
  await cLog(LogLevels.INFO, LOG_RANGE, operateUserId, `generatePayoutRecord() called: ${projectId}.`)

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    }
  })

  if (!project) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Project not existed."
    })
  }

  if (project.status !== "COMPLETED") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid project state."
    })
  }

  // All of the documents should be closed
  const notClosedDocs = await prisma.document.findMany({
    where: {
      projectId: projectId,
      state: { not: "CLOSED" }
    }
  })

  if (notClosedDocs) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not closed documents exist."
    })
  }

  // Get all the income records of this project
  const incomes = await prisma.incomeRecord.findMany({
    where: {
      projectId: projectId,
      payoutRecordId: null
    }
  })

  // Create payout records based on different users
  const payouts: { userId: string, amount: number }[] = []

}


