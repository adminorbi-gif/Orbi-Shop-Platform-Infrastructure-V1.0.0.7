import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { getAdminSupabase, getSupabase } from "../lib/supabase.js";

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

    const supabase = getAdminSupabase();
    
    const { data, error } = await supabase.storage
      .from("orbi-shop-images")
      .upload(objectKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("orbi-shop-images")
      .getPublicUrl(objectKey);

    return res.json({
      success: true,
      publicUrl: publicUrlData.publicUrl,
      objectKey,
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

    const supabase = getAdminSupabase();
    
    const { error } = await supabase.storage
      .from("orbi-shop-images")
      .remove([storagePath]);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
    });
  } catch (error: any) {
    return handleStorageError(res, error, "Failed to delete file");
  }
});

export default router;

