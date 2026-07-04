import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = Router();

const DEFAULT_UPLOAD_MB = 10;
const MIN_UPLOAD_MB = 1;
const MAX_UPLOAD_MB_ALLOWED = 1024; 

function safeParseMb(value: unknown): number {
  if (value == null) return DEFAULT_UPLOAD_MB;
  const n = Number(value);
  if (!Number.isFinite(n) || isNaN(n)) return DEFAULT_UPLOAD_MB;
  const int = Math.floor(n);
  if (int < MIN_UPLOAD_MB) return MIN_UPLOAD_MB;
  if (int > MAX_UPLOAD_MB_ALLOWED) return MAX_UPLOAD_MB_ALLOWED;
  return int;
}

const configuredMb = safeParseMb(process.env.MAX_UPLOAD_MB ?? process.env.ORBI_MAX_UPLOAD_MB ?? undefined);
export const MAX_UPLOAD_MB = configuredMb;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
});

function multerSingleFile(req: Request, res: Response) {
  return new Promise<void>((resolve, reject) => {
    // @ts-ignore
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

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!s3Client) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn("[STORAGE] Missing Cloudflare R2 credentials. Falling back to local storage.");
      return null;
    }

    s3Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      region: "auto",
    });
  }
  return s3Client;
}

const getBucketName = () => {
  return process.env.CLOUDFLARE_BUCKET_NAME || "";
};

const getPublicUrlPrefix = () => {
  return process.env.CLOUDFLARE_PUBLIC_URL_PREFIX || "";
};

router.post("/upload", async (req: Request, res: Response) => {
  try {
    await multerSingleFile(req, res);

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Expected form field name: file.",
      });
    }

    const folder = ((req as any).body?.folder as string) || "products";
    const fileName = file.originalname || "upload";
    const ext = path.extname(fileName) || "";
    const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const objectKey = `${folder}/${Date.now()}-${randomUUID()}-${baseName}${ext}`;

    const bucketName = getBucketName();
    const s3 = getS3Client();

    if (bucketName && s3) {
      try {
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        const prefix = getPublicUrlPrefix();
        const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
        const publicUrl = `${cleanPrefix}/${objectKey}`;

        console.log(`[STORAGE] Uploaded to Cloudflare R2: ${publicUrl}`);

        return res.json({
          success: true,
          publicUrl,
          objectKey,
          size: file.size,
          contentType: file.mimetype,
          maxUploadMb: MAX_UPLOAD_MB,
        });
      } catch (r2Error: any) {
        console.error("[STORAGE] Cloudflare R2 upload failed, falling back to local storage:", r2Error.message || r2Error);
      }
    }

    // Local Fallback
    console.log("[STORAGE] Saving file locally as fallback...");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}-${randomUUID()}-${baseName}${ext}`;
    const localFilePath = path.join(uploadsDir, safeFileName);

    await fs.promises.writeFile(localFilePath, file.buffer);

    // Return relative URL for browser, and prefix the objectKey so we know it's local
    const publicUrl = `/uploads/${safeFileName}`;
    const localKey = `local-uploads/${safeFileName}`;

    console.log(`[STORAGE] Local fallback saved: ${publicUrl}`);

    return res.json({
      success: true,
      publicUrl,
      objectKey: localKey,
      size: file.size,
      contentType: file.mimetype,
      maxUploadMb: MAX_UPLOAD_MB,
    });

  } catch (error: any) {
    return handleStorageError(res, error, "Upload failed");
  }
});

router.post("/delete", async (req: Request, res: Response) => {
  try {
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({
        success: false,
        message: "storagePath is required",
      });
    }

    console.log(`[STORAGE] Deleting file: ${storagePath}`);

    // If it's local fallback storage
    if (storagePath.startsWith("local-uploads/")) {
      const fileName = storagePath.replace("local-uploads/", "");
      const localFilePath = path.join(process.cwd(), "public", "uploads", fileName);
      if (fs.existsSync(localFilePath)) {
        await fs.promises.unlink(localFilePath);
        console.log(`[STORAGE] Deleted local file: ${localFilePath}`);
      }
      return res.json({
        success: true,
      });
    }

    // Otherwise delete from Cloudflare R2
    const bucketName = getBucketName();
    const s3 = getS3Client();
    if (bucketName && s3) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: storagePath,
        }));
        console.log(`[STORAGE] Deleted from Cloudflare R2: ${storagePath}`);
        return res.json({
          success: true,
        });
      } catch (r2Error: any) {
        console.error("[STORAGE] Cloudflare R2 delete failed:", r2Error.message || r2Error);
        return res.json({
          success: true,
          warn: "Cloudflare delete failed but completed operation"
        });
      }
    }

    return res.json({
      success: true,
    });
  } catch (error: any) {
    return handleStorageError(res, error, "Failed to delete file");
  }
});

export default router;

