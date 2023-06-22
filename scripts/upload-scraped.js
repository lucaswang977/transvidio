// Runs with NodeJS under commandline
//
// After we have scraped all the materials to local, 
// we have to upload them to S3 before we can trigger 
// the project data importing in the Admin.

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const S3Client = require("@aws-sdk/client-s3").S3Client;
const Upload = require("@aws-sdk/lib-storage").Upload;

const ignoreList = ['.DS_Store', 'node_modules'];
dotenv.config();

// Check command-line arguments
if (process.argv.length < 4) {
  console.log('Please provide the target directory and local directory as command-line arguments!');
  console.log('Usage: node your-script.js <target-directory> <local-directory>');
  process.exit(1);
}

// Get the target directory and local directory
const targetDirectory = process.argv[2];
const localDirectory = process.argv[3];

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

function shouldIgnore(file) {
  return ignoreList.includes(file);
}

// Function to process and upload files
async function processAndUploadFiles() {
  try {
    const files = fs.readdirSync(localDirectory);

    for (const file of files) {
      if (shouldIgnore(file)) {
        continue;
      }
      const filePath = path.join(localDirectory, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isFile()) {
        const s3Key = path.join(targetDirectory, file);

        if (path.extname(file).toLowerCase() === '.mp4') {
          const convertedFilePath = path.join(localDirectory, 'converted_' + file);
          await convertVideoTo480p(filePath, convertedFilePath);
          await uploadFileToS3(convertedFilePath, s3Key);
          fs.unlinkSync(convertedFilePath);
        } else {
          await uploadFileToS3(filePath, s3Key);
        }

        console.log(`File uploaded to S3: ${s3Key}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
processAndUploadFiles();

