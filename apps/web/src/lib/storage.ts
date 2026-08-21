import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

function resolveUploadRoot() {
  const configured = process.env.UPLOAD_DIR;
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }
  // fallback gravável em containers (nextjs user)
  return path.join("/tmp", "orbe-uploads");
}

const uploadRoot = resolveUploadRoot();

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function getS3Client() {
  return new S3Client({
    region: process.env.MINIO_REGION ?? "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials:
      process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY
        ? {
            accessKeyId: process.env.MINIO_ACCESS_KEY,
            secretAccessKey: process.env.MINIO_SECRET_KEY,
          }
        : undefined,
  });
}

export async function putObject(file: File, prefix = "sessions") {
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `${prefix}/${uuid()}-${safeName(file.name || "audio")}`;

  if (process.env.STORAGE_MODE === "minio") {
    const bucket = process.env.MINIO_BUCKET ?? "orbe";
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    return {
      key,
      url: `s3://${bucket}/${key}`,
    };
  }

  const fullPath = path.join(uploadRoot, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);

  return {
    key,
    url: fullPath,
  };
}

export async function getObject(key: string) {
  if (process.env.STORAGE_MODE === "minio") {
    const bucket = process.env.MINIO_BUCKET ?? "orbe";
    const result = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return result.Body?.transformToByteArray();
  }

  return readFile(path.join(uploadRoot, key));
}
