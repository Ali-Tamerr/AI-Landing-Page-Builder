import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      tone = "Professional", 
      colorTheme = "Indigo", 
      targetAudience = "General Audience",
      tweakAsset,
      tweakInstruction,
      previousCampaignState 
    } = body;

    if (!prompt && !tweakInstruction) {
      return NextResponse.json({ error: "Product description or tweak instructions are required" }, { status: 400 });
    }

    const apiKey = process.env.COPYAI_GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-flash-latest for super fast and highly accurate structural JSON generation
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemInstruction = `You are a world-class marketing campaigns creator, visual art director, and premium landing page engineer.
You generate highly effective digital campaign assets in structured JSON format.

Your output must be a single, valid JSON object containing exactly the following keys:
1. "socialCopy": A compelling social media post copy (approx 100-200 words) tailored to the brand's tone. Include relevant visual descriptions, engaging emojis, and target hashtags.
2. "adCopy": An ad campaign suite containing search and social feeds copy:
   - "googleSearch": { "headline": "A short, premium headline (max 30 chars)", "description": "A high-converting description (max 90 chars)" }
   - "facebookFeed": { "headline": "Engaging scroll-stopping headline", "description": "Compelling feed narrative copy", "cta": "Learn More" }
3. "imagePrompt": A highly descriptive visual prompt for a text-to-image AI model (like FLUX or Stable Diffusion). Describe the style (e.g. "high-end editorial product photography", "sleek studio flatlay"), subject, lighting, modern color theme matching ${colorTheme}, and composition details. Do not use generic buzzwords like "photorealistic".
4. "landingPageHtml": A self-contained, high-converting, and responsive mini-landing page HTML document. 
   - It MUST include a \`<script src="https://cdn.tailwindcss.com"></script>\` tag and a modern premium Google Font (like Plus Jakarta Sans or Inter) in the \`<head>\` for gorgeous layout styling.
   - It MUST use standard Tailwind class utilities for styling, ensuring a clean background, vibrant accent buttons, a beautiful sticky header with a custom brand logo placeholder, a Hero section with CTA forms, a responsive Features grid, testimonial cards, and a clean footer.
   - Match the color scheme of "${colorTheme}" (e.g. if emerald, use emerald and teal accents; if indigo, use indigo gradients; if dark mode, use slate-900 background with glowing border cards).
   - Ensure the layout is 100% responsive and visually complete (no mock comment blocks, write actual high-quality copy).

Response Format:
You MUST respond with pure JSON matching this exact structure. Do not wrap the output in markdown code blocks like \`\`\`json. Return a raw string that can be parsed directly with JSON.parse().`;

    let userPrompt = "";

    if (tweakInstruction && tweakAsset && previousCampaignState) {
      userPrompt = `You are refining an existing marketing campaign.
Previous Campaign State:
${JSON.stringify(previousCampaignState, null, 2)}

The user wants to refine/tweak a specific campaign asset: "${tweakAsset}".
Their specific tweak instructions are: "${tweakInstruction}"

Please update the specified asset ("${tweakAsset}") in the campaign based on their instructions. 
IMPORTANT: 
- Keep all other assets (e.g. other copy blocks or HTML layout) exactly the same as in the Previous Campaign State, unless they must change to maintain design consistency with the tweaked asset.
- If editing the landingPageHtml, ensure it remains a valid, full HTML document with the Tailwind script and matching styling.
- Return the full updated campaign JSON object containing all 4 keys ("socialCopy", "adCopy", "imagePrompt", "landingPageHtml").`;
    } else {
      userPrompt = `Create an entire, high-converting multi-asset marketing campaign for the following:
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Make the landing page structure extremely modern, using grids, custom flex layouts, nice gradients, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
    }

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
      systemInstruction: systemInstruction,
    });

    const text = response.response.text();
    
    // Validate that the output can be parsed as JSON
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Gemini failed to output valid JSON. Raw text was:", text);
      return NextResponse.json(
        { error: "AI response failed to parse as valid campaign data. Please try again.", raw: text },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Generate Campaign API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate campaign assets" },
      { status: 500 }
    );
  }
}
