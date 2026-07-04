export const uploadFileViaStorageApi = async (
  rawFile: File,
  folder: "products" | "promotions" | "messages" | "niches",
  onProgress?: (progress: number) => void,
): Promise<string> => {
  let file = rawFile;
  // Convert basic images to webp to save space
  if (
    file.type.startsWith("image/") &&
    file.type !== "image/webp" &&
    file.type !== "image/gif" &&
    file.type !== "image/svg+xml"
  ) {
    try {
      file = await new Promise<File>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(rawFile);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(rawFile);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(rawFile);
              resolve(
                new File(
                  [blob],
                  rawFile.name.replace(/\.[^/.]+$/, "") + ".webp",
                  { type: "image/webp" },
                ),
              );
            },
            "image/webp",
            0.85,
          );
        };
        img.onerror = () => resolve(rawFile);
        img.src = url;
      });
    } catch (e) {
      file = rawFile;
    }
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/storage/upload", true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success) resolve(res.publicUrl);
              else reject(new Error(res.message || "Failed to upload"));
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            console.error("Upload Error:", xhr.responseText);
            reject(new Error(`Kosa la kupakia faili: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Munganisho umefeli (Network error)"));
        };

        xhr.send(formData);
      });
    } else {
      const uploadRes = await fetch("/api/v1/storage/upload", {
        method: "POST",
        body: formData,
      });

      const resJson = await uploadRes.json();
      if (!uploadRes.ok || !resJson.success) {
        throw new Error(
          `Kosa la kupakia: ${resJson.message || uploadRes.statusText}`,
        );
      }
      return resJson.publicUrl;
    }
  } catch (error: any) {
    console.error("Storage Error:", error);
    throw error;
  }
};

export const deleteFileViaStorageApi = async (storagePath: string): Promise<void> => {
  try {
    const res = await fetch("/api/v1/storage/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath }),
    });
    
    if (!res.ok) {
      throw new Error(`Failed to delete file: ${res.statusText}`);
    }
    
    const resJson = await res.json();
    if (!resJson.success) {
      throw new Error(resJson.message || "Failed to delete file");
    }
  } catch (error) {
    console.error("Storage Delete Error:", error);
    throw error;
  }
};
