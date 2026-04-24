import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

function getS3Client() {
  if (!region || !bucketName) {
    throw new Error("S3 is not configured. Set AWS_REGION and AWS_S3_BUCKET_NAME.");
  }

  return new S3Client({
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
  });
}

function getFileExtension(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  return extensionIndex >= 0 ? fileName.slice(extensionIndex) : "";
}

function buildObjectUrl(key: string) {
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extension = getFileExtension(file.name);
    const key = `cards/${Date.now()}-${crypto.randomUUID()}${extension}`;

    const s3Client = getS3Client();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    return NextResponse.json({
      key,
      url: buildObjectUrl(key),
    });
  } catch (error) {
    console.error("Failed to upload file to S3", error);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 },
    );
  }
}
