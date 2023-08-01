import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { type NextRequest } from 'next/server';
import { env } from "~/env.mjs";

export const runtime = 'edge';

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "SPEECH"

export default async function handler(req: NextRequest) {
  if (req.method === "GET") {
    const phrase = req.nextUrl.searchParams.get("phrase")
    if (!phrase) {
      return new Response(null, { status: 500 })
    }

    await cLog(LogLevels.INFO, LOG_RANGE, "unknown", `synthesis() called: ${phrase}.`)

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      env.AZURE_SPEECH_KEY, env.AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = 5; // mp3
    speechConfig.speechSynthesisLanguage = "zh-CN";
    speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoyiNeural";

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    synthesizer.synthesisCompleted = async function(_s, e) {
      await cLog(LogLevels.INFO, LOG_RANGE, "unknown", `synthesis complete: ${e.result.audioData.byteLength}.`)
    };

    const arrayBufferStream = new ReadableStream({
      start(controller) {
        synthesizer.speakTextAsync(
          phrase,
          (result) => {
            const { audioData } = result;
            const dataView = new Uint8Array(audioData)
            let chunkIndex = 0;

            function pushNextChunk() {
              const chunk = dataView.subarray(chunkIndex, chunkIndex + 1024)
              chunkIndex += chunk.length

              if (chunk.length > 0) {
                controller.enqueue(chunk)
              }

              if (chunkIndex >= dataView.length) {
                controller.close()
                synthesizer.close()
              } else {
                setTimeout(pushNextChunk, 0)
              }
            }

            pushNextChunk();
          },
          (error) => {
            console.log(error)
            synthesizer.close()
          }
        );
      }
    });
    return new Response(arrayBufferStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
      }
    })
  }
}

