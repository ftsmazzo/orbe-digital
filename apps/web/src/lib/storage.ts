import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

function resolveUploadRoot() {
  const configured = process.env.UPLOAD_DIR;
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }
  return path.join("/tmp", "orbe-uploads");
}

const uploadRoot = resolveUploadRoot();

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

/**
 * AWS SDK rejeita hostnames com underscore (ex.: orbe_orbe-minio do Docker).
 * Em EasyPanel use o domínio público do MinIO (sem underscore).
 */
function resolveMinioEndpoint(): string {
  const raw = (process.env.MINIO_ENDPOINT ?? "").trim();
  if (!raw) {
    throw new Error("MINIO_ENDPOINT nao configurado.");
  }

  const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error(`MINIO_ENDPOINT invalido: ${raw}`);
  }

  if (!url.hostname || url.hostname.includes("_")) {
    throw new Error(
      `MINIO_ENDPOINT hostname invalido (${url.hostname || "vazio"}). ` +
        "O SDK S3 nao aceita underscore. Use o dominio publico do MinIO, " +
        "ex.: https://orbe-minio.kxryyk.easypanel.host",
    );
  }

  return url.origin;
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: process.env.MINIO_REGION ?? "us-east-1",
    endpoint: resolveMinioEndpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? "",
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
    },
  });
  return s3Client;
}

function usingMinio() {
  return (process.env.STORAGE_MODE ?? "local").toLowerCase() === "minio";
}

export async function putObject(file: File, prefix = "sessions") {
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `${prefix}/${uuid()}-${safeName(file.name || "audio")}`;

  if (usingMinio()) {
    const bucket = process.env.MINIO_BUCKET ?? "orbe";
    try {
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: file.type || "application/octet-stream",
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao gravar audio no MinIO: ${message}`);
    }

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
  if (usingMinio()) {
    const bucket = process.env.MINIO_BUCKET ?? "orbe";
    try {
      const result = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return result.Body?.transformToByteArray();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao ler audio no MinIO: ${message}`);
    }
  }

  return readFile(path.join(uploadRoot, key));
}
