
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resizes an image file or blob to a specified width and quality.
 * Returns a Promise that resolves to a Data URL (string).
 */
export const processAndResizeImage = (
  fileOrBlob: File | Blob, 
  maxWidth: number = 800, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlob);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic: Maintain aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to JPEG format
           const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
           resolve(resizedDataUrl);
        } else {
           reject(new Error('Canvas context unavailable'));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
