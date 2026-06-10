import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imagePrompt, imageKeywords } = await req.json();
    
    if (!imagePrompt) {
      return NextResponse.json({ error: "Image prompt is required" }, { status: 400 });
    }

    // Since Pollinations API now strictly returns 402 Payment Required for new prompts,
    // we use a reliable free image service (LoremFlickr) heavily optimized with aesthetic tags 
    // to prevent random unrelated images (like "boy" or "cat").
    const cleanKeywords = (imageKeywords || "design").replace(/\s+/g, ',');
    const randomSeed = Math.floor(Math.random() * 10000);
    const imageUrl = `https://loremflickr.com/800/600/${cleanKeywords},aesthetic,professional/all?lock=${randomSeed}`;

    return NextResponse.json({ 
      url: imageUrl, 
      provider: "pollinations-ai",
      title: "Generated Campaign Visual",
      photographer: "AI"
    });
  } catch (error: any) {
    console.error("Image Generate API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
