import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || "";
const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

export async function POST(request: NextRequest) {
  // Check API key
  if (!REMOVE_BG_API_KEY) {
    return NextResponse.json(
      { error: "Remove.bg API key not configured. Please set REMOVE_BG_API_KEY environment variable." },
      { status: 500 }
    );
  }

  try {
    // Get the image data from request
    // In this implementation, we expect base64 encoded image data
    // because passing raw binary can have edge runtime issues
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(image.split(",")[1] || image, "base64");

    if (imageBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 12MB" },
        { status: 400 }
      );
    }

    // Create form data for remove.bg API
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    formData.append("image_file", blob, "image.png");
    formData.append("size", "auto");
    formData.append("format", "png");

    // Call remove.bg API
    const response = await fetch(REMOVE_BG_API_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Remove.bg API error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.errors?.[0]?.title) {
          errorMessage = errorData.errors[0].title;
        }
      } catch {
        // Ignore parse errors
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Get the result image as blob
    const resultBlob = await response.blob();

    // Return the image
    return new NextResponse(resultBlob, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error removing background:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};
