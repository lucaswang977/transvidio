import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import * as mm from 'music-metadata';
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth/next"
import { cLog, LogLevels } from "~/utils/helper"
import type { NextApiRequest, NextApiResponse } from 'next';
const LOG_RANGE = "SPEECH"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === "GET") {
    const phrase = req.query.phrase as string
    if (!phrase) {
      return new Response(null, { status: 500 })
    }

    await cLog(LogLevels.INFO, LOG_RANGE, session ? session.user.id : "unknown", `synthesis() called: ${phrase}.`)

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      env.AZURE_SPEECH_KEY, env.AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = 5; // mp3
    speechConfig.speechSynthesisLanguage = "zh-CN";
    speechConfig.speechSynthesisVoiceName = "zh-CN-YunjianNeural";

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    synthesizer.synthesisCompleted = async function(_s, e) {
      await cLog(LogLevels.INFO, LOG_RANGE, "unknown", `synthesis complete: ${e.result.audioData.byteLength}.`)
    };

    synthesizer.speakTextAsync(
      phrase,
      async (result) => {
        const { audioData } = result;
        const dataView = new Uint8Array(audioData)
        const metadata = await mm.parseBuffer(dataView, 'audio/mpeg', { duration: true });

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
          'Audio-Duration': metadata.format.duration
        })

        let chunkIndex = 0;

        function pushNextChunk() {
          const chunk = dataView.subarray(chunkIndex, chunkIndex + 1024)
          chunkIndex += chunk.length

          if (chunk.length > 0) {
            res.write(chunk)
          }

          if (chunkIndex >= dataView.length) {
            res.end()
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
}

