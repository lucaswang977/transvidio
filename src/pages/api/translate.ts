import { ChatOpenAI } from 'langchain/chat_models/openai';
import { CallbackManager } from 'langchain/callbacks';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import type { NextRequest } from 'next/server';
import type { ProjectAiParamters } from '~/types';

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
      const { translate, character, background, syllabus } = await req.json() as RequestDataType

      const aiParams: ProjectAiParamters = {
        character: character,
        background: background,
        syllabus: syllabus
      }

      // Check if the request is for a streaming response.
      const streaming = req.headers.get('accept') === 'text/event-stream';
      if (streaming) {
        // For a streaming response we need to use a TransformStream to
        // convert the LLM's callback-based API into a stream-based API.
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const chat = new ChatOpenAI({
          // modelName: "gpt-3.5-turbo-0301",
          modelName: "gpt-3.5-turbo",
          // modelName: "gpt-3.5-turbo-16k-0613",
          streaming,
          temperature: 0.8,
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
        const systemMessageTemplate = "Your character: {character}.\n Background: {background}\n Requirements: Your response should only include the translation result and nothing else. If there are HTML tags in the original text, keep them, just translate the texts.\nTranslate my input from {srcLang} to {dstLang}."
        const prompt = await ChatPromptTemplate.fromPromptMessages([
          SystemMessagePromptTemplate.fromTemplate(systemMessageTemplate),
          HumanMessagePromptTemplate.fromTemplate("{translate}")
        ]).formatMessages({
          character: aiParams.character,
          background: aiParams.background,
          srcLang: "en-US",
          dstLang: "zh-CN",
          translate: translate
        });

        chat.call(prompt).then((m) => { console.log(m.text) }).catch(e => console.log(e))

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


