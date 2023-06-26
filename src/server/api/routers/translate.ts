import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { prisma } from "~/server/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";

import type { ProjectAiParamters } from "~/types";

export const translateRouter = createTRPCRouter({
  saveAiParams: protectedProcedure
    .input(z.object({
      projectId: z.string().nonempty(),
      value: z.string().nonempty()
    }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existed."
        })
      }

      const objVal = JSON.parse(input.value) as ProjectAiParamters
      if (!objVal) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Value invalid."
        })
      }

      const updatedProject = await prisma.project.update({
        where: {
          id: input.projectId
        },
        data: {
          aiParameter: objVal
        }
      })

      return updatedProject.id
    }),

  translate: protectedProcedure
    .input(z.object({
      projectId: z.string().nonempty(),
      text: z.string().nonempty(),
    }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
        }
      })

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not existed."
        })
      }

      const aiParams = project.aiParameter as ProjectAiParamters
      const messageTemplate = "Assume you are a specialist described as following: {character}.\nYou are going to help me to translate any content from {srcLang} to {dstLang}\nThe content we are going to translate is described as following: {background}\nYou should just answer the translated sentence without anything else."

      const chat = new ChatOpenAI({ temperature: 0 });
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(messageTemplate),
        HumanMessagePromptTemplate.fromTemplate("{text}"),
      ]);
      const chain = new LLMChain({ prompt: chatPrompt, llm: chat })

      const res = await chain.call({
        character: aiParams.character,
        background: aiParams.background,
        srcLang: project.srcLang,
        dstLang: project.dstLang,
        text: input.text
      })

      console.log(res)
      return (res as { text: string }).text
    }),
});
