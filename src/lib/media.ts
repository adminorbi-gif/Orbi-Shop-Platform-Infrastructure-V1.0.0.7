export const getStoragePath = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  // Legacy cleanup support only. New uploads/deletes go through
  // /api/v1/storage/* and never call storage providers from the browser.
  const bucketSubstr = "/storage/v1/object/public/";
  const index = url.indexOf(bucketSubstr);
  if (index !== -1) {
    const objectPath = url.substring(index + bucketSubstr.length);
    const [, ...pathParts] = objectPath.split("/");
    if (pathParts.length > 0) {
      return decodeURIComponent(pathParts.join("/"));
    }
  }
  return null;
};

export const extractMediaFromText = (text: string) => {
  if (!text) return { text: "", mediaUrl: undefined };
  const regex = /\[MEDIA:(https?:\/\/[^\]]+)\]/;
  const match = text.match(regex);
  if (match) {
    const mediaUrl = match[1];
    const cleanedText = text.replace(regex, "").trim();
    return { text: cleanedText, mediaUrl };
  }
  return { text, mediaUrl: undefined };
};

export const isImage = (url?: string) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.endsWith(".webp") ||
    url.startsWith("data:image/")
  );
};

export const isVideo = (url?: string) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".quicktime") ||
    url.startsWith("data:video/")
  );
};
