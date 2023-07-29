import { prisma } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { getConfigByKey, getAllConfigs } from '~/utils/helper';
import { AppConfigKeys } from "~/utils/helper"
import type { Currency, PaymentMethod } from "@prisma/client";

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
  const rateStr = await getConfigByKey(`${AppConfigKeys.BASIC_COST_PREFIX}${docType}`)
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

  // All of the documents should be closed
  const notClosedDocs = await prisma.document.findMany({
    where: {
      projectId: projectId,
      state: { not: "CLOSED" }
    }
  })

  if (notClosedDocs.length > 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Unclosed documents exist."
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
  const payouts: {
    number: number,
    exchangeRate: number,
    paymentCurrency: Currency,
    paymentTarget: string,
    paymentMethod: PaymentMethod,
    userId: string,
    incomeIds: string[]
  }[] = []

  const configs = await getAllConfigs()

  for (const income of incomes) {
    const payout = payouts.find(item => item.userId === income.userId)
    let exchangeRate = 0

    if (!payout) {
      // Get user payment info
      const user = await prisma.user.findUnique({
        where: {
          id: income.userId
        }
      })

      if (!user) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${income.userId} not found.`
        })
      }

      if (!user.paymentCurrency || !user.paymentMethod || !user.paymentTarget) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${income.userId} payment info invalid.`
        })
      }

      if (user.paymentCurrency === "CNY") {
        const c = configs.find(item => item.key === `${AppConfigKeys.EXCHANGE_RATE_PREFIX}USDCNY`)
        if (c) {
          exchangeRate = parseFloat(c.value)
        }
      } else if (user.paymentCurrency === "JPY") {
        const c = configs.find(item => item.key === `${AppConfigKeys.EXCHANGE_RATE_PREFIX}USDJPY`)
        if (c) {
          exchangeRate = parseFloat(c.value)
        }
      } else if (user.paymentCurrency === "USD") {
        exchangeRate = 1
      }

      if (exchangeRate === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Exchange rate invalid.`
        })
      }

      payouts.push({
        number: income.number,
        exchangeRate: exchangeRate,
        paymentCurrency: user.paymentCurrency,
        paymentTarget: user.paymentTarget,
        paymentMethod: user.paymentMethod,
        userId: user.id,
        incomeIds: [income.id]
      })
    } else {
      payout.number = payout.number + income.number
      payout.incomeIds.push(income.id)
    }
  }

  for (const payout of payouts) {
    const result = await prisma.payoutRecord.create({
      data: {
        number: payout.number,
        exchangeRate: payout.exchangeRate,
        paymentCurrency: payout.paymentCurrency,
        paymentTarget: payout.paymentTarget,
        paymentMethod: payout.paymentMethod,
        status: "NOTPAID",
        projectId: projectId,
        userId: payout.userId,
      }
    })

    await prisma.incomeRecord.updateMany({
      data: {
        payoutRecordId: result.id
      },
      where: {
        id: {
          in: payout.incomeIds
        }
      }
    })
  }

  await cLog(LogLevels.INFO, LOG_RANGE, operateUserId, `generatePayoutRecord() success: ${projectId}, ${payouts.length} records generated.`)
}
