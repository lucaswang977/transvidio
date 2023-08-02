// Runs with NodeJS under commandline
//
// Upload one video file to S3

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const FormData = require('form-data');

const S3Client = require("@aws-sdk/client-s3").S3Client;
const Upload = require("@aws-sdk/lib-storage").Upload;

const parse = require('@plussub/srt-vtt-parser').parse;

dotenv.config();

// Check command-line arguments
if (process.argv.length < 4) {
  console.log('Please provide the target directory and local directory as command-line arguments!');
  console.log('Usage: node your-script.js <project-id> <video-file>');
  process.exit(1);
}

// Get the target directory and local directory
const targetDirectory = process.argv[2];
const videoFile = process.argv[3];

async function transcribeToVtt(filePath, modelName) {
  console.log("Transcribing audio...", filePath)
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('model', modelName);
  formData.append('response_format', "vtt")

  try {
    const response = await axios.post(`https://api.openai.com/v1/audio/transcriptions`, formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
}

function uploadFileToS3(filePath, s3Key) {
  const fileStream = fs.createReadStream(filePath);
  const s3Client = new S3Client(
    {
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileStream,
    },
  });
  console.log(`File uploaded to S3: ${s3Key}`);

  return upload.done()
}

// Function to convert a video file to 480p
function convertVideoTo480p(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    console.log(`Converting video file: ${inputFilePath}`)
    ffmpeg(inputFilePath)
      .output(outputFilePath)
      .videoCodec('libx264')
      .size('854x480')
      .outputOptions('-crf 28')
      .on('end', () => resolve(outputFilePath))
      .on('error', reject)
      .run();
  });
}

function convertVideoToMp3(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    console.log(`Converting to mp3 file: ${inputFilePath}`)
    ffmpeg(inputFilePath)
      .output(outputFilePath)
      .videoCodec('libx264')
      .size('854x480')
      .on('end', () => resolve(outputFilePath))
      .on('error', reject)
      .run();
  });
}
// Function to process and upload files
async function processAndUploadFile() {
  try {
    const fileStat = fs.statSync(videoFile);

    if (fileStat.isFile()) {
      const s3Key = path.join(targetDirectory, path.basename(videoFile));

      if (path.extname(videoFile).toLowerCase() === '.mp4') {
        const convertedFilePath = path.join(path.dirname(videoFile), '/converted_' + path.basename(videoFile));
        await convertVideoTo480p(videoFile, convertedFilePath);
        await uploadFileToS3(convertedFilePath, s3Key);
        fs.unlinkSync(convertedFilePath);
        const mp3FilePath = path.join(path.dirname(videoFile), path.basename(videoFile, ".mp4")) + ".mp3";
        await convertVideoToMp3(videoFile, mp3FilePath);
        const vtt = await transcribeToVtt(mp3FilePath, "whisper-1")
        const { entries } = parse(vtt)
        const srcJson = {
          videoUrl: `${process.env.CDN_BASE_URL}/${s3Key}`,
          subtitle: entries
        }
        console.log("====== Source JSON ======")
        console.log(JSON.stringify(srcJson))
        console.log("====== Source JSON ======")
        fs.unlinkSync(mp3FilePath);
      } else {
        throw new Error("The extension of file must be .mp4")
      }

    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
processAndUploadFile();

