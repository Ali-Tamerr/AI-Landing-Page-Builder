import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    // Load social media design skill for image generation
    let socialMediaDesignSkill = "";
    try {
      const skillPath = path.join(process.cwd(), "skills", "social-media-design.md");
      socialMediaDesignSkill = fs.readFileSync(skillPath, "utf-8");
    } catch (e) {
      console.warn("Could not load social media design skill", e);
    }

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


    const systemInstruction = `You are a world-class marketing campaigns creator, visual art director, and premium landing page engineer.
You generate highly effective digital campaign assets in structured JSON format.

Your output must be a single, valid JSON object containing exactly the following keys:
1. "socialCopy": A compelling social media post copy (approx 100-200 words) tailored to the brand's tone. Include relevant visual descriptions, engaging emojis, and target hashtags.
2. "adCopy": An ad campaign suite containing search and social feeds copy:
   - "googleSearch": { "headline": "A short, premium headline (max 30 chars)", "description": "A high-converting description (max 90 chars)" }
   - "facebookFeed": { "headline": "Engaging scroll-stopping headline", "description": "Compelling feed narrative copy", "cta": "Learn More" }
3. "imagePrompt": A highly descriptive visual prompt for a text-to-image AI model (like FLUX or Stable Diffusion). Describe the style (e.g. "high-end editorial product photography", "sleek studio flatlay"), subject, lighting, modern color theme matching ${colorTheme}, and composition details. Do not use generic buzzwords like "photorealistic".
4. "imageKeywords": A single, high-probability search term matching the primary subject of the campaign (e.g., 'barber', 'car', 'lamp', 'laptop') to ensure accurate placeholder image fetching.
5. "landingPageHtml": A self-contained, high-converting, and comprehensive landing page HTML document. 
   - It MUST include a \`<script src="https://cdn.tailwindcss.com"></script>\` tag and a modern premium Google Font (like Plus Jakarta Sans or Inter) in the \`<head>\` for gorgeous layout styling.
   - The document MUST be a complete, long-form website with at least 6 distinct sections:
     1. A sleek Sticky Header with logo and navigation links.
     2. A high-impact Hero section with a strong headline, product/service copy, floating interactive badges, and an email signup / appointment booking form.
     3. A detailed Services & Features Grid (with descriptive icons and subtle hovering card effects).
     4. A clean Pricing or Packages comparison grid (detailing different tiers or options).
     5. A Testimonials section with customer review cards.
     6. An FAQ section with pre-filled question and answer boxes (styled as clean interactive accordions).
     7. A high-contrast bottom conversion CTA row.
     8. A detailed, multi-column Footer with copyright, brand description, and links.
   - Match the color scheme of "${colorTheme}" (e.g. if emerald, use emerald and teal gradients; if indigo, use indigo gradients; if dark mode, use slate-900 background with glowing border cards).
   - Ensure the layout is 100% responsive, uses semantic tags, and has complete, high-quality copywriting (never use empty layout placeholders).

Response Format:
You MUST respond with a single, valid JSON object matching this exact structure. 
Do not wrap the output in markdown code blocks like \`\`\`json. Return a raw string that can be parsed directly with JSON.parse().
IMPORTANT: Ensure all newlines, backslashes, double quotes, and control characters inside JSON string values are strictly escaped (e.g. use '\\n' for newlines, '\\"' for quotes) to avoid invalid JSON output.

--- IMAGE PROMPT GUIDELINES ---
When generating the "imagePrompt", you MUST apply the stylistic theories from the following design guidelines, but DO NOT output the guidelines themselves.
Keep the "imagePrompt" concise and extremely descriptive (maximum 500 characters).
${socialMediaDesignSkill}
-------------------------------
`;

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
- Return the full updated campaign JSON object containing all keys.`;
    } else {
      userPrompt = `Create an entire, high-converting multi-asset marketing campaign for the following:
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Make the landing page structure extremely modern, using grids, custom flex layouts, nice gradients, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try multiple models in order of preference (best/newest to fallback older models) to handle 503/429 rate limits
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest"
    ];
    let response;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                socialCopy: { 
                  type: SchemaType.STRING,
                  description: "Compelling social media post copy."
                },
                adCopy: {
                  type: SchemaType.OBJECT,
                  properties: {
                    googleSearch: {
                      type: SchemaType.OBJECT,
                      properties: {
                        headline: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING }
                      },
                      required: ["headline", "description"]
                    },
                    facebookFeed: {
                      type: SchemaType.OBJECT,
                      properties: {
                        headline: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING },
                        cta: { type: SchemaType.STRING }
                      },
                      required: ["headline", "description", "cta"]
                    }
                  },
                  required: ["googleSearch", "facebookFeed"]
                },
                imagePrompt: { 
                  type: SchemaType.STRING,
                  description: "Visual generation prompt."
                },
                imageKeywords: {
                  type: SchemaType.STRING,
                  description: "A single primary keyword or two comma-separated words representing the main subject (e.g., 'barber', 'car', 'lamp') to search for placeholder images."
                },
                landingPageHtml: { 
                  type: SchemaType.STRING,
                  description: "Full, self-contained HTML page using Tailwind CSS."
                }
              },
              required: ["socialCopy", "adCopy", "imagePrompt", "imageKeywords", "landingPageHtml"]
            },
            temperature: 0.7,
          },
          systemInstruction: systemInstruction,
        });
        if (response) {
          console.log(`Successfully generated campaign content using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying next fallback. Error:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("All generative models failed to respond.");
    }

    const text = response.response.text();
    
    // Validate that the output can be parsed as JSON
    try {
      let cleanText = text.trim();
      
      // Strip markdown code block wrappers if present
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
      }
      
      try {
        const parsed = JSON.parse(cleanText);
        return NextResponse.json(parsed);
      } catch (directError) {
        // Fallback: Find the first '{' and last '}' to isolate the JSON object
        const startIdx = cleanText.indexOf("{");
        const endIdx = cleanText.lastIndexOf("}");
        
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const isolated = cleanText.substring(startIdx, endIdx + 1);
          const parsed = JSON.parse(isolated);
          return NextResponse.json(parsed);
        } else {
          throw directError;
        }
      }
    } catch (e: any) {
      console.error("Gemini failed to output valid JSON. Raw text was:", text);
      return NextResponse.json(
        { 
          error: "AI response failed to parse as valid campaign data. Please try again.", 
          raw: text,
          details: e.message 
        },
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
