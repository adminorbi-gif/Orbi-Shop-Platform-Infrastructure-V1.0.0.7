import { Router, Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const router = Router();

// Robust upload size parsing and defaults
const DEFAULT_UPLOAD_MB = 10;
const MIN_UPLOAD_MB = 1;
const MAX_UPLOAD_MB_ALLOWED = 1024; // 1 GB upper bound (adjust if needed)

function safeParseMb(value: unknown): number {
  if (value == null) return DEFAULT_UPLOAD_MB;
  const n = Number(value);
  if (!Number.isFinite(n) || isNaN(n)) return DEFAULT_UPLOAD_MB;
  const int = Math.floor(n);
  if (int < MIN_UPLOAD_MB) return MIN_UPLOAD_MB;
  if (int > MAX_UPLOAD_MB_ALLOWED) return MAX_UPLOAD_MB_ALLOWED;
  return int;
}

// Read configured value from ORBI-specific env var first, then generic, then default
const configuredMb = safeParseMb(process.env.MAX_UPLOAD_MB ?? process.env.ORBI_MAX_UPLOAD_MB ?? undefined);
export const MAX_UPLOAD_MB = configuredMb;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Multer configuration (memory storage kept for compatibility). If you expect larger or many concurrent uploads,
// replace this with diskStorage or a streaming approach to avoid buffering in memory.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
});

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || process.env.R2_BUCKET_NAME || "";
  const publicUrlPrefix = (
    process.env.CLOUDFLARE_PUBLIC_URL_PREFIX ||
    process.env.R2_PUBLIC_URL_PREFIX ||
    ""
  ).replace(/\/$/, "");

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlPrefix };
}

function validateR2Config() {
  const config = getR2Config();

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== "publicUrlPrefix" && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 is not fully configured. Missing: ${missing.join(
        ", "
      )}. Required env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, CLOUDFLARE_BUCKET_NAME.`
    );
  }

  if (!config.publicUrlPrefix) {
    throw new Error(
      "Cloudflare R2 public URL prefix is not configured. Set CLOUDFLARE_PUBLIC_URL_PREFIX or R2_PUBLIC_URL_PREFIX."
    );
  }

  return config;
}

function getS3Client() {
  const { accountId, accessKeyId, secretAccessKey } = validateR2Config();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function sanitizeFolder(folder: unknown) {
  const rawFolder = typeof folder === "string" && folder.trim() ? folder.trim() : "products";

  const cleanFolder = rawFolder
    .replace(/\\/g, "/")
    .split("/")
    .map((part) =>
      part
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
    )
    .filter(Boolean)
    .join("/");

  return cleanFolder || "products";
}

function sanitizeBaseName(fileName: string) {
  const parsed = path.parse(fileName || "upload");

  return (
    (parsed.name || "upload")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 80) || "upload"
  );
}

function normalizeExtension(fileName: string, fileType?: string) {
  const ext = path.extname(fileName || "").replace(".", "").toLowerCase();

  if (ext && /^[a-z0-9]{1,10}$/.test(ext)) return ext;

  if (fileType?.startsWith("image/")) {
    const subtype = fileType.split("/")[1]?.split(";")[0]?.toLowerCase();
    if (subtype === "jpeg") return "jpg";
    if (subtype && /^[a-z0-9]{1,10}$/.test(subtype)) return subtype;
  }

  return "bin";
}

function buildObjectKey(fileName: string, fileType: string | undefined, folder: unknown) {
  const safeFolder = sanitizeFolder(folder);
  const cleanName = sanitizeBaseName(fileName);
  const ext = normalizeExtension(fileName, fileType);

  return `${safeFolder}/${Date.now()}-${randomUUID()}-${cleanName}.${ext}`;
}

function multerSingleFile(req: Request, res: Response) {
  return new Promise<void>((resolve, reject) => {
    // @ts-ignore - multer augments req with file
    upload.single("file")(req as any, res as any, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function handleStorageError(res: Response, error: any, fallbackMessage: string) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File is too large. Maximum allowed upload size is ${MAX_UPLOAD_MB}MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid upload request.",
      code: error.code,
    });
  }

  const message = error?.message || fallbackMessage;
  console.error(`[STORAGE] ${fallbackMessage}:`, message);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: process.env.NODE_ENV === "production" ? undefined : message,
  });
}

// TTL for presigned URLs, configurable via env
const DEFAULT_PRESIGN_TTL = 3600; // seconds
function getPresignTtl(): number {
  const raw = process.env.ORBI_PRESIGN_TTL_SEC ?? process.env.PRESIGN_TTL_SEC ?? undefined;
  const n = Number(raw);
  if (!raw || Number.isNaN(n) || !Number.isFinite(n) || n <= 0) return DEFAULT_PRESIGN_TTL;
  // cap to a reasonable maximum (24 hours)
  return Math.min(Math.floor(n), 24 * 3600);
}

router.post("/upload", async (req: Request, res: Response) => {
  try {
    await multerSingleFile(req, res);

    // Multer attaches file to req as any
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Expected form field name: file.",
      });
    }

    const { bucketName, publicUrlPrefix } = validateR2Config();
    const fileName = file.originalname || "upload";
    const fileType = file.mimetype || "application/octet-stream";
    const objectKey = buildObjectKey(fileName, fileType, (req as any).body?.folder);

    console.log(
      `[STORAGE] Uploading ${file.size} bytes to Cloudflare R2 bucket: "${bucketName}", key: "${objectKey}"`
    );

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

    return res.json({
      success: true,
      publicUrl,
      objectKey,
      size: file.size,
      contentType: fileType,
      maxUploadMb: MAX_UPLOAD_MB,
    });
  } catch (error: any) {
    return handleStorageError(res, error, "Upload failed");
  }
});

router.post("/presigned-url", async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder } = req.body as {
      fileName?: string;
      fileType?: string;
      folder?: unknown;
    };

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing fileName or fileType",
      });
    }

    const { bucketName, publicUrlPrefix } = validateR2Config();
    const objectKey = buildObjectKey(fileName, fileType, folder);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
    });

    const s3 = getS3Client();
    const expiresIn = getPresignTtl();
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    const publicUrl = `${publicUrlPrefix}/${objectKey}`;

    return res.json({
      success: true,
      uploadUrl,
      publicUrl,
      objectKey,
      maxUploadMb: MAX_UPLOAD_MB,
      presignTtlSec: expiresIn,
    });
  } catch (error: any) {
    return handleStorageError(res, error, "Failed to generate upload URL");
  }
});

export default router;
