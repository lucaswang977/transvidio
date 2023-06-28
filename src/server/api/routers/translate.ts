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

      const chat = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        // modelName: "gpt-3.5-turbo-16k-0613",
        temperature: 0.8,
        timeout: 8000,
        callbacks: [
          {
            handleLLMError: (err: Error) => {
              console.error(err);
            },
          },
        ],
      });
      const systemMessageTemplate = "Translate from {srcLang} to {dstLang}."
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(systemMessageTemplate),
        HumanMessagePromptTemplate.fromTemplate("{character}.\nWe can describe the scope of the content that needs to be translated as follows: {background}\nYour response should only include the translation result and nothing else. If there are HTML tags in the original text, keep them, just translate the texts.\nIf you remember, please reply Yes\n"),
      ]);

      const prompt0 = await chatPrompt.formatMessages({
        character: aiParams.character,
        background: aiParams.background,
        srcLang: project.srcLang,
        dstLang: project.dstLang,
        text: input.text
      })

      const prompt = await ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(systemMessageTemplate),
        HumanMessagePromptTemplate.fromTemplate("{text}")
      ]).formatMessages({
        srcLang: project.srcLang,
        dstLang: project.dstLang,
        text: input.text
      });

      const res = await chat.generate([
        prompt0,
        prompt
      ])

      const resultText: string[] = []

      res.generations.forEach((r, i) => {
        if (i !== 0 && r[0]) resultText.push(r[0].text)
      })


      console.log(res.llmOutput?.tokenUsage)
      return resultText.join("")
    }),
});
