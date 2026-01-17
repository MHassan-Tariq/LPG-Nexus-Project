import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const imageUrl = await uploadToCloudinary(image);
    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error.message 
    }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
