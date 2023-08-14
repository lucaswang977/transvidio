import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import * as mm from 'music-metadata';
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth/next"
import { cLog, LogLevels } from "~/utils/helper"
import type { NextApiRequest, NextApiResponse } from 'next';
import Ffmpeg from 'fluent-ffmpeg'
import * as fs from "fs"
import { Readable } from 'stream'

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
    const voiceLang = "zh-CN";
    const voiceName = "zh-CN-YunjianNeural";
    // const voiceName = "zh-CN-YunxiNeural";
    const voiceRole = "SeniorMale"
    const voiceStyle = "excited"
    const voiceRate = "0%"

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    synthesizer.synthesisCompleted = async function(_s, e) {
      await cLog(LogLevels.INFO, LOG_RANGE, session ? session.user.id : "unknown", `synthesis complete: ${e.result.audioData.byteLength}.`)
    };

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voiceLang}"> <voice name="${voiceName}"> <mstts:express-as role="${voiceRole}" style="${voiceStyle}"> <prosody rate="${voiceRate}">${phrase}</prosody></mstts:express-as></voice></speak>`

    return new Promise<void>(resolve => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          const { audioData } = result;

          Ffmpeg()
            .input(new Readable({
              read() {
                this.push(Buffer.from(audioData))
                this.push(null)
              }
            }))
            .audioFilters([
              'silenceremove=stop_periods=1:stop_duration=0.4:stop_threshold=0:detection=peak'
            ])
            .output("/tmp/output.mp3")
            .on('end', async () => {
              const dataView = new Uint8Array(fs.readFileSync("/tmp/output.mp3"))
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
                  resolve()
                } else {
                  setTimeout(pushNextChunk, 0)
                }
              }

              pushNextChunk();
            })
            .run()
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

