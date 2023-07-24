import { ChatOpenAI } from 'langchain/chat_models/openai';
import { CallbackManager } from 'langchain/callbacks';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import type { NextRequest } from 'next/server';
import type { ProjectAiParamters } from '~/types';
import { get } from '@vercel/edge-config';
import { decode } from "next-auth/jwt"

import { cLog, LogLevels } from "~/utils/helper"
import { env } from '~/env.mjs';
const LOG_RANGE = "TRANSLATE"

export const runtime = 'edge';

type RequestDataType = {
  translate: string,
  character: string,
  background: string,
  syllabus: string
}

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    try {
      const sessionCookie = req.cookies.get("next-auth.session-token")
      if (!(sessionCookie && env.NEXTAUTH_SECRET)) {
        throw new Error("Authentication failed.")
      }

      const result = await decode({ token: sessionCookie.value, secret: env.NEXTAUTH_SECRET })
      const userId = (result as { id: string }).id
      const { translate, character, background, syllabus } = await req.json() as RequestDataType
      await cLog(LogLevels.INFO, LOG_RANGE, userId, `translate() called: ${translate.length}.`)

      const aiParams: ProjectAiParamters = {
        character: character,
        background: background,
        syllabus: syllabus
      }
      const model = await get("general_openaiGptModel")
      const modelName = model ? model.toString() : "gpt-3.5-turbo"

      // Check if the request is for a streaming response.
      const streaming = req.headers.get('accept') === 'text/event-stream';
      if (streaming) {
        // For a streaming response we need to use a TransformStream to
        // convert the LLM's callback-based API into a stream-based API.
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const chat = new ChatOpenAI({
          modelName: modelName,
          streaming,
          temperature: 0.95,
          callbackManager: CallbackManager.fromHandlers({
            handleLLMNewToken: async (token: string) => {
              await writer.ready;
              await writer.write(encoder.encode(`data: ${token}\n\n`));
            },
            handleLLMEnd: async () => {
              await writer.ready;
              await writer.close();
            },
            handleLLMError: async (e: Error) => {
              await writer.ready;
              await writer.abort(e);
            },
          }),
        });

        const systemMessageTemplate =
          `You will help me to translate some sentences. \
          Your character: {character}. \
          Content background: {background} \
          Translation recommendation: {syllabus} \
          Reply requirement: Your response should only include the translation result and nothing else. \
          Use a natural tone and with professional vocabularies to deliver your point of view. \
          If there are HTML tags in the original text, keep them, just translate the texts.`

        const prompt = await ChatPromptTemplate.fromPromptMessages([
          SystemMessagePromptTemplate.fromTemplate(systemMessageTemplate),
          HumanMessagePromptTemplate.fromTemplate("Translate from {srcLang} to {dstLang}: {translate}")
        ]).formatMessages({
          character: aiParams.character,
          background: aiParams.background,
          srcLang: "en-US",
          dstLang: "zh-CN",
          translate: translate,
          syllabus: syllabus
        });

        chat.call(prompt).then(async (m) => {
          await cLog(LogLevels.INFO, LOG_RANGE, userId, `translate() success: ${m.text.length}.`)
        }).catch(e => console.error(e))

        // We don't need to await the result of the chain.run() call because
        // the LLM will invoke the callbackManager's handleLLMEnd() method
        return new Response(stream.readable, {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      } else {
        return new Response(JSON.stringify("Not supported yet."), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as { message: string }).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}


