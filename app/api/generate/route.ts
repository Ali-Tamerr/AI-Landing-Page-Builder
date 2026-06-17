import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      tone = "Professional",
      colorTheme = "Indigo",
      targetAudience = "General Audience",
      previousHtml,
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.COPYAI_GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const systemInstruction = `You are a world-class frontend engineer and UI/UX expert.
You build premium, beautiful, modern, high-converting landing pages.
You must output your response in standard Markdown format:
1. First, write a short, friendly explanation/thinking section (approx 50-100 words) written to the user explaining what design choices you made, what sections you created/modified, and how it aligns with their request.
2. Then, write the complete HTML document inside a single \`\`\`html and \`\`\` code block.

Landing Page HTML Guidelines:
- It MUST include a \`<script src="https://cdn.tailwindcss.com"></script>\` tag and a modern premium Google Font (like Plus Jakarta Sans, Outfit, or Inter) in the \`<head>\` for gorgeous layout styling.
- The document MUST be a complete, long-form website with distinct components:
  1. A sleek Sticky Header with logo and navigation links.
  2. A high-impact Hero section with a strong headline, product/service copy, floating interactive elements, and an email signup or call-to-action form.
  3. A detailed Services & Features Grid (with descriptive SVG icons and subtle hovering card animations).
  4. A clean Pricing/Packages comparison grid (detailing different tiers or options).
  5. A Testimonials section with customer review cards.
  6. An FAQ section with Q&A cards (styled as clean interactive elements).
  7. A high-contrast bottom conversion CTA row.
  8. A detailed, multi-column Footer with copyright, brand description, and links.
- Make the design feel premium, using HSL colors, smooth gradients, subtle micro-interactions, custom scrollbars, and modern shadows.
- Match the color scheme of "${colorTheme}" (e.g., if Indigo, Violet, Emerald, Rose, Amber, or Dark Theme).
- Use Tailwind CSS colors and classes for everything.
- Ensure the layout is 100% responsive, uses semantic tags, and has complete, high-quality copywriting (never use empty layout placeholders or lorem ipsum).`;

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
Ensure you return the FULL updated HTML document inside the \`\`\`html and \`\`\` code block. Do not truncate or use placeholders like "// rest of code goes here".
Describe the modifications and design reasoning in the thinking section at the start of your message.`;
    } else {
      userPrompt = `Create a brand new, high-converting landing page.
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Make the landing page structure extremely modern, using grids, custom flex layouts, nice gradients, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ];

    let streamResult;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
          },
          systemInstruction: systemInstruction,
        });
        if (result) {
          streamResult = result;
          console.log(
            `Successfully initiated stream using model: ${modelName}`,
          );
          break;
        }
      } catch (err: any) {
        console.warn(
          `Model ${modelName} failed to initiate stream. Error:`,
          err.message || err,
        );
        lastError = err;
      }
    }

    if (!streamResult) {
      throw lastError || new Error("All generative models failed to respond.");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
        } catch (e: any) {
          console.error("Stream generation error:", e);
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Generate Website Stream API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate website code",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
