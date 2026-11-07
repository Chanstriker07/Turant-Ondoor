import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config";
import { HttpError } from "./errors";

// Neon Object Storage speaks S3; credentials, endpoint and region come from the AWS_* env vars.
let client: S3Client | undefined;
function s3() {
  if (!config.storageEnabled) throw new HttpError(503, "Object storage is not configured");
  client ??= new S3Client({ forcePathStyle: true });
  return client;
}

export async function presignUpload(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: config.storageBucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3(), command, { expiresIn: 600 });
}

export async function presignDownload(key: string) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: config.storageBucket, Key: key }), { expiresIn: 3600 });
}
