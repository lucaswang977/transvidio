import { NextApiHandler } from "next";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuid } from 'uuid';
import * as pechkin from "pechkin"
import { PassThrough } from "stream";

export const config = {
  api: {
    bodyParser: false,
  },
}

const uploadFileToS3 = (key: string, stream: PassThrough) => {
  const s3Client = new S3Client(
    {
      region: "ap-northeast-3",
      credentials: {
        accessKeyId: "AKIA5MBDWKMRJTWLOG7B",
        secretAccessKey: "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"
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
  let i = 0;

  for await (const { stream, field } of files) {
    const key = uuid();

    results.push(
      uploadFileToS3(key, stream)
        .then(({ Location }) => ({ field, location: Location }))
    );

    i++;
  }

  const r = await Promise.all(results)
  res.json({ fields, files: r })

  console.log(r)
};

export default handler;
