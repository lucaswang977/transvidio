import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth/next"
import { cLog, LogLevels } from "~/utils/helper"
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AudioSynthesisParamsType } from '~/types';
// import Ffmpeg from 'fluent-ffmpeg'
// import * as fs from "fs"
// import { Readable } from 'stream'
// import * as mm from 'music-metadata';

const LOG_RANGE = "SPEECH"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === "POST") {
    const { voices, params } = JSON.parse(req.body as string) as { voices: string, params?: AudioSynthesisParamsType }
    if (!voices) {
      return res.end({ status: 500 })
    }

    await cLog(LogLevels.INFO, LOG_RANGE, session ? session.user.id : "unknown", `synthesis() called: ${voices.length}.`)

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      env.AZURE_SPEECH_KEY, env.AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
    const voiceLang = params ? params.lang : "zh-CN"

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    synthesizer.synthesisCompleted = async function(_s, e) {
      await cLog(LogLevels.INFO, LOG_RANGE, session ? session.user.id : "unknown", `synthesis complete: ${e.result.audioData.byteLength / (16000 * 1 * 16 / 8) * 1000}ms.`)
    };

    const ssml =
      `<speak 
        version="1.0" 
        xmlns="http://www.w3.org/2001/10/synthesis" 
        xmlns:mstts="https://www.w3.org/2001/mstts" 
        xml:lang="${voiceLang}">
        ${voices}
       </speak>`
    console.log(ssml)

    return new Promise<void>(resolve => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          const { audioData } = result;

          // Ffmpeg()
          //   .input(new Readable({
          //     read() {
          //       this.push(Buffer.from(audioData))
          //       this.push(null)
          //     }
          //   }))
          //   .audioFilters([
          //     'silenceremove=stop_periods=1:stop_duration=0.4:stop_threshold=0:detection=peak'
          //   ])
          //   .output("/tmp/output.mp3")
          //   .on('end', async () => {
          // const dataView = new Uint8Array(fs.readFileSync("/tmp/output.mp3"))
          if (audioData) {
            const dataView = new Uint8Array(audioData)

            res.writeHead(200, {
              'Content-Type': 'aplication/octet-stream',
              'Transfer-Encoding': 'chunked',
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
                resolve()
              } else {
                setTimeout(pushNextChunk, 0)
              }
            }

            pushNextChunk();

          } else {
            console.log(result)
          }
          // })
          // .run()
        },
        (error) => {
          console.log(error)
          synthesizer.close()
          res.end()
          resolve()
        }
      )
    })
  }
}

