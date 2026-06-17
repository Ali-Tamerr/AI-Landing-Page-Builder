import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      tone = "Professional", 
      colorTheme = "Indigo", 
      targetAudience = "General Audience",
      previousHtml 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.COPYAI_GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are a world-class frontend engineer and UI/UX expert.
You build premium, beautiful, modern, high-converting landing pages.
You always generate valid, structured JSON containing exactly two keys:
1. "thinking": A short, friendly message (approx 50-100 words) written to the user explaining what design choices you made, what sections you created/modified, and how it aligns with their request.
2. "landingPageHtml": A self-contained, gorgeous, responsive HTML document.

Landing Page HTML Guidelines:
- It MUST include a \`<script src="https://cdn.tailwindcss.com"></script>\` tag and a modern premium Google Font (like Plus Jakarta Sans, Outfit, or Inter) in the \`<head>\` for gorgeous layout styling.
- The document MUST be a complete, long-form website with distinct components:
  1. A sleek Sticky Header with logo and navigation links.
  2. A high-impact Hero section with a strong headline, product/service copy, floating interactive elements, and an email signup or call-to-action form.
  3. A detailed Services & Features Grid (with descriptive SVG icons and subtle hovering card animations).
  4. A clean Pricing/Packages comparison grid (detailing different tiers or options).
  5. A Testimonials section with customer review cards.
  6. An FAQ section with pre-filled Q&A cards (styled as clean interactive elements).
  7. A high-contrast bottom conversion CTA row.
  8. A detailed, multi-column Footer with copyright, brand description, and links.
- Make the design feel premium, using HSL colors, smooth gradients, subtle micro-interactions, custom scrollbars, and modern shadows.
- Match the color scheme of "${colorTheme}" (e.g., if Indigo, Violet, Emerald, Rose, Amber, or Dark Theme).
- Use Tailwind CSS colors and classes for everything.
- Ensure the layout is 100% responsive, uses semantic tags, and has complete, high-quality copywriting (never use empty layout placeholders or lorem ipsum).

Response Format:
You MUST respond with a single, valid JSON object matching this exact structure. 
Do not wrap the output in markdown code blocks like \`\`\`json. Return a raw string that can be parsed directly with JSON.parse().
IMPORTANT: Ensure all newlines, backslashes, double quotes, and control characters inside JSON string values are strictly escaped (e.g. use '\\n' for newlines, '\\"' for quotes) to avoid invalid JSON output.`;

    let userPrompt = "";

    if (previousHtml) {
      userPrompt = `You are refining an existing landing page HTML based on a new user instruction.
Previous Landing Page HTML:
\`\`\`html
${previousHtml}
\`\`\`

The user's instruction for this iteration is: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Please update the landing page HTML based on their instructions. 
Ensure you return the FULL updated HTML document in "landingPageHtml". Do not truncate or use placeholders like "// rest of code goes here".
Describe the modifications and design reasoning in "thinking".`;
    } else {
      userPrompt = `Create a brand new, high-converting landing page.
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Make the landing page structure extremely modern, using grids, custom flex layouts, nice gradients, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try multiple models in order of preference to handle rate limits or transient errors
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
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
                thinking: { 
                  type: SchemaType.STRING,
                  description: "A summary message of changes and design choices."
                },
                landingPageHtml: { 
                  type: SchemaType.STRING,
                  description: "Full, self-contained HTML page using Tailwind CSS."
                }
              },
              required: ["thinking", "landingPageHtml"]
            },
            temperature: 0.7,
          },
          systemInstruction: systemInstruction,
        });
        if (response) {
          console.log(`Successfully generated website content using model: ${modelName}`);
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
          error: "AI response failed to parse as valid website data. Please try again.", 
          raw: text,
          details: e.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Generate Website API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate website code" },
      { status: 500 }
    );
  }
}
