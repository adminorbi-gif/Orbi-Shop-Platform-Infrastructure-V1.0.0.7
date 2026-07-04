import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ success: false, error: "Invalid or expired session." });
    }

    (req as any).user = data.user;
    next();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Authentication check failed." });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    let role =
      (req as any).user?.app_metadata?.role ||
      (req as any).user?.user_metadata?.role;

    // Hardcoded fallback for root admin
    if (!role && (req as any).user?.email?.toLowerCase() === "admin.orbi@gmail.com") {
      role = "super_admin";
    }

    const effectiveRoles = [...allowedRoles];
    if (allowedRoles.includes("admin") && !effectiveRoles.includes("super_admin")) {
      effectiveRoles.push("super_admin");
    }

    if (!role || !effectiveRoles.includes(role)) {
      return res.status(403).json({ success: false, error: "Permission denied." });
    }

    next();
  };
}
