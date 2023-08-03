// Runs with NodeJS under commandline
//
// After we have scraped all the materials to local, 
// we have to upload them to S3 before we can trigger 
// the project data importing in the Admin.

const dotenv = require('dotenv');
const fs = require('fs').promises;
const fsSync = require('fs')
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const yargs = require('yargs');

const axios = require('axios');
const FormData = require('form-data');

const S3Client = require("@aws-sdk/client-s3").S3Client;
const Upload = require("@aws-sdk/lib-storage").Upload;

const ignoreList = ['.DS_Store', 'node_modules'];
dotenv.config();

// Check command-line arguments
const argv = yargs
  .option("project-id", {
    alias: "p",
    describe: "project ID",
  })
  .option("local-directory", {
    alias: "d",
    describe: "local directory",
  })
  .option("transcribe", {
    alias: "t",
    describe: "whether transcribing is needed",
    boolean: true
  })
  .demandOption(["project-id", "local-directory"])
  .help()
  .argv;

// Get the target directory and local directory
const targetDirectory = argv['project-id'];
const localDirectory = argv['local-directory'];
const isTranscribingNeeded = argv['transcribe'];

async function transcribeToVtt(filePath, modelName) {
  console.log("Transcribing audio...", filePath)
  const formData = new FormData();
  formData.append('file', fsSync.createReadStream(filePath));
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
    console.error(error)
  }
}

function uploadFileToS3(filePath, s3Key) {
  const fileStream = fsSync.createReadStream(filePath);
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

function shouldIgnore(file) {
  return ignoreList.includes(file);
}

// Function to process and upload files
async function processAndUploadFiles() {
  try {
    const files = await fs.readdir(localDirectory);

    console.log("Total files: ", files.length)
    let index = 0
    for (const file of files) {
      index = index + 1
      if (shouldIgnore(file)) {
        continue;
      }
      const filePath = path.join(localDirectory, file);
      console.log(`#${index}/${files.length} Dealing with ${filePath}`)

      const fileExtname = path.extname(file)
      const fileBasename = path.basename(file, fileExtname)

      const fileStat = await fs.stat(filePath);

      if (fileStat.isFile()) {
        if (fileExtname.toLowerCase() === '.mp4' || fileExtname.toLowerCase() === '.mov') {
          const convertedFilePath = path.join('./', 'converted_' + fileBasename + '.mp4');
          await convertVideoTo480p(filePath, convertedFilePath);

          const videoS3Key = path.join(targetDirectory, fileBasename + ".mp4");
          await uploadFileToS3(convertedFilePath, videoS3Key);

          await fs.unlink(convertedFilePath);

          if (isTranscribingNeeded) {
            const mp3FilePath = path.join('./', fileBasename + ".mp3");
            await convertVideoToMp3(filePath, mp3FilePath);

            const vtt = await transcribeToVtt(mp3FilePath, "whisper-1")
            const vttFilename = fileBasename + ".mp4.src.vtt"
            const vttFilepath = path.join('./', vttFilename)
            await fs.writeFile(vttFilepath, vtt)
            console.log("Save VTT file: ", vttFilepath)

            const vttS3Key = path.join(targetDirectory, vttFilename)
            await uploadFileToS3(vttFilepath, vttS3Key);

            await fs.unlink(mp3FilePath);
            await fs.unlink(vttFilepath);
          }
        } else {
          const s3Key = path.join(targetDirectory, file);
          await uploadFileToS3(filePath, s3Key);
        }
      } else {
        console.log("Not a normal file.")
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
processAndUploadFiles();

