import "server-only";

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

/**
 * Uploads a base64 image to Cloudinary using the REST API.
 * Uses the credentials from process.env.CLOUDINARY_URL.
 */
export async function uploadToCloudinary(base64Image: string): Promise<string> {
  if (!CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is not configured");
  }

  // Parse CLOUDINARY_URL: cloudinary://key:secret@cloudname
  const regex = /cloudinary:\/\/([^:]+):([^@]+)@(.+)/;
  const match = CLOUDINARY_URL.match(regex);

  if (!match) {
    throw new Error("Invalid CLOUDINARY_URL format");
  }

  const [, apiKey, apiSecret, cloudName] = match;

  // For unsigned uploads, we'd need a preset. 
  // For signed uploads (more secure), we need a signature.
  // Since we have the secret, we can generate a signature server-side.
  
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
  
  // We need a way to hash in Node.js
  const crypto = require('crypto');
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Cloudinary Upload Error:", data);
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
}
