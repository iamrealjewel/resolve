import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth-utils";
import fs from "fs/promises";
import path from "path";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 1. Authorization check
    await checkAuth();

    const resolvedParams = await params;
    const filePath = resolvedParams.path.join("/");
    const safePath = path.join(process.cwd(), "uploads_secure", filePath);

    // 2. Security: Ensure path doesn't escape uploads_secure
    const absoluteRoot = path.join(process.cwd(), "uploads_secure");
    if (!safePath.startsWith(absoluteRoot)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Check if file exists
    try {
      await fs.access(safePath);
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 4. Read and serve file
    const fileBuffer = await fs.readFile(safePath);
    
    // Attempt to determine content type
    const ext = path.extname(safePath).toLowerCase();
    const contentType = getContentType(ext);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

function getContentType(ext: string) {
  const mimeTypes: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".zip": "application/zip",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
