import { Router } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || process.env.R2_BUCKET_NAME || "";
  const publicUrlPrefix = process.env.CLOUDFLARE_PUBLIC_URL_PREFIX || process.env.R2_PUBLIC_URL_PREFIX || "";

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrlPrefix,
  };
}

function getS3Client() {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      `Cloudflare R2 is not fully configured. Missing environment variables. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY.`
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { bucketName, publicUrlPrefix } = getR2Config();
    if (!bucketName) {
      throw new Error("Cloudflare R2 Bucket name is not configured. Missing CLOUDFLARE_BUCKET_NAME.");
    }

    const { folder } = req.body;
    const fileName = file.originalname || "upload";
    const fileType = file.mimetype || "application/octet-stream";
    const ext = fileName.split(".").pop() || "png";
    const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeFolder = folder || "products";
    const objectKey = `${safeFolder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}_${cleanName}.${ext}`;

    console.log(`[STORAGE] Uploading file to Cloudflare R2 bucket: "${bucketName}", key: "${objectKey}"`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
      Body: file.buffer,
    });

    const s3 = getS3Client();
    await s3.send(command);

    const publicUrl = `${publicUrlPrefix}/${objectKey}`;
    console.log("[STORAGE] Cloudflare R2 upload successful:", publicUrl);

    res.json({
      success: true,
      publicUrl,
      objectKey
    });
  } catch (error: any) {
    console.error("[STORAGE] Cloudflare R2 upload failed:", error.message);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
});

router.post("/presigned-url", async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: "Missing fileName or fileType" });
    }

    const { bucketName, publicUrlPrefix } = getR2Config();
    if (!bucketName) {
      throw new Error("Cloudflare R2 Bucket name is not configured. Missing CLOUDFLARE_BUCKET_NAME.");
    }

    const ext = fileName.split(".").pop() || "png";
    const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeFolder = folder || "products";
    const objectKey = `${safeFolder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}_${cleanName}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
    });

    const s3 = getS3Client();
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `${publicUrlPrefix}/${objectKey}`;

    res.json({
      success: true,
      uploadUrl,
      publicUrl,
      objectKey
    });
  } catch (error: any) {
    console.error("[STORAGE] Error generating presigned URL:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate upload URL", error: error.message });
  }
});

export default router;
