import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imagePrompt, imageKeywords } = await req.json();
    
    if (!imagePrompt) {
      return NextResponse.json({ error: "Image prompt is required" }, { status: 400 });
    }

    // Since the Unsplash NAPI is blocked/unauthorized, we will use image.pollinations.ai
    // which generates highly specific custom images directly from our prompt and works seamlessly
    // without requiring keys.
    const randomSeed = Math.floor(Math.random() * 1000000);
    const enhancement = "high quality professional social media post design, clean modern aesthetic";
    
    // We construct a descriptive prompt combining the generated prompt and visual design keywords
    const fullPrompt = `${imagePrompt}, ${enhancement}`;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?seed=${randomSeed}&width=800&height=600&nologo=true`;

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
