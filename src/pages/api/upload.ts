import type { NextApiHandler } from "next";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuid } from 'uuid';
import * as pechkin from "pechkin"
import type { Readable } from "stream";
import { env } from "~/env.mjs"

export const config = {
  api: {
    bodyParser: false,
  },
}

const uploadFileToS3 = (key: string, stream: Readable) => {
  const s3Client = new S3Client(
    {
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: 'transvidio',
      Key: key,
      Body: stream,
    },
  });

  return upload.done()
}

const handler: NextApiHandler = async (req, res) => {
  const { fields, files } = await pechkin.parseFormData(req, {
    maxTotalFileFieldCount: Infinity,
    maxFileCountPerField: Infinity,
    maxTotalFileCount: Infinity
  })

  const results = [];

  for await (const file of files) {
    const key = uuid();
    const item = file as { filename: string, stream: Readable }

    results.push(
      uploadFileToS3(key, item.stream)
        .then((res) => {
          if ("Location" in res) return {
            file: item.filename,
            location: res.Location
          }
        })
    );
  }

  const r = await Promise.all(results)
  res.json({ fields, files: r })
};

export default handler;
