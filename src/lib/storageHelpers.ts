import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "case-files";
const SIGNED_URL_EXPIRY = 60; // 60 seconds — generated fresh at click time

/**
 * Upload a file and return the storage path (not a public URL).
 */
export async function uploadCaseFile(path: string, file: File) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

/**
 * Get a signed URL for a storage path. Works with both:
 * - raw paths like "userId/caseId/filename"
 * - legacy full public URLs (extracts path automatically)
 */
export async function getSignedFileUrl(pathOrUrl: string): Promise<string> {
  const path = extractStoragePath(pathOrUrl);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return pathOrUrl; // fallback to original
  }
  return data.signedUrl;
}

/**
 * Download a file using a signed URL.
 */
export async function downloadCaseFile(pathOrUrl: string, filename: string) {
  try {
    // Always generate a fresh signed URL at click time
    const path = extractStoragePath(pathOrUrl);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY, { download: filename });
    if (error || !data?.signedUrl) {
      throw error || new Error("Could not generate download URL");
    }
    // Force download via anchor element
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = filename || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Download error:", err);
    toast.error("Download failed. Please try again or contact support at info@hdi-tech.com");
  }
}

/**
 * Extract the storage path from a full public URL or return the path as-is.
 */
export function extractStoragePath(pathOrUrl: string): string {
  // If it's a full URL, extract just the path after /object/public/case-files/
  const publicMarker = "/object/public/case-files/";
  const idx = pathOrUrl.indexOf(publicMarker);
  if (idx !== -1) {
    return decodeURIComponent(pathOrUrl.substring(idx + publicMarker.length));
  }
  // Also handle signed URL paths
  const signedMarker = "/object/sign/case-files/";
  const sIdx = pathOrUrl.indexOf(signedMarker);
  if (sIdx !== -1) {
    const pathWithQuery = pathOrUrl.substring(sIdx + signedMarker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0]);
  }
  return pathOrUrl;
}
