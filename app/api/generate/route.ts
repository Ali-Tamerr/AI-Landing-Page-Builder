import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface FileEntry {
  name: string;
  language: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      tone = "Professional",
      colorTheme = "Indigo",
      targetAudience = "General Audience",
      previousHtml,
      selectedSkill,
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let skillContent = "";
    if (selectedSkill) {
      try {
        // Check if this is a directory-based skill (e.g. ui-ux-pro-max with scripts/search.py)
        const skillDir = path.join(process.cwd(), "skills", selectedSkill.replace(".md", ""));
        const scriptPath = path.join(skillDir, "scripts", "search.py");

        if (fs.existsSync(scriptPath)) {
          // Build a search query from the request context
          const searchQuery = `${prompt} ${tone} ${targetAudience}`.replace(/"/g, "").slice(0, 200);
          try {
            skillContent = execSync(
              `python skills/ui-ux-pro-max/scripts/search.py "${searchQuery}" --design-system -f markdown`,
              { cwd: process.cwd(), timeout: 15000, encoding: "utf-8" }
            );
            console.log("ui-ux-pro-max design system fetched successfully.");
          } catch (scriptErr: unknown) {
            const msg = scriptErr instanceof Error ? scriptErr.message : String(scriptErr);
            console.warn("Python skill script failed, falling back to SKILL.md:", msg);
            const skillMd = path.join(skillDir, "SKILL.md");
            if (fs.existsSync(skillMd)) {
              skillContent = fs.readFileSync(skillMd, "utf-8");
            }
          }
        } else {
          // Plain .md skill file
          const skillPath = path.join(process.cwd(), "skills", selectedSkill);
          if (fs.existsSync(skillPath)) {
            skillContent = fs.readFileSync(skillPath, "utf-8");
          }
        }
      } catch (err) {
        console.error("Failed to load skill:", err);
      }
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

    let systemInstruction = `You are a world-class frontend engineer and UI/UX expert.
You build premium, beautiful, modern, high-converting websites and landing pages.
You support creating multiple HTML, CSS, and JS files per project to keep the code modular and clean if needed (e.g. index.html, about.html, style.css, script.js, etc).
You must output your response in standard Markdown format:
1. First, write a short, friendly explanation/thinking section (approx 50-100 words) written to the user explaining what design choices you made, what files you created/modified, and how they align with their request.
2. Then, write each file in the project prefixed by "[File: filename.ext]" followed by the file's code block.

INTERACTIVE QUESTIONS & USER INTERVIEWING (grill-me skill):
Whenever the user requests an interview (using "/grill-me"), or whenever you need to clarify requirements, design decisions, tone, audience, color schemes, or specific sections BEFORE writing code, you must ask the user questions one at a time.
For every question you ask, you MUST format it as a JSON object inside a special markdown code block with the language label "question". Do not include any other code blocks or file contents if you are just interviewing the user.

The JSON object inside the \`\`\`question code block MUST have this structure:
{
  "question": "The question text, written clearly and directly.",
  "options": [
    "Option 1 description",
    "Option 2 description",
    "Option 3 description"
  ],
  "recommendation": "One of the options from the list that you recommend based on best practices."
}

Format Example:
Which color theme would you prefer for the landing page? I recommend Indigo & Slate for a premium developer feel.

\`\`\`question
{
  "question": "Which color theme fits your developer SaaS?",
  "options": [
    "Indigo & Slate (Clean, corporate, modern)",
    "Emerald & Zinc (Organic, financial, fresh)",
    "Rose & Obsidian (Bold, creative, premium)"
  ],
  "recommendation": "Indigo & Slate (Clean, corporate, modern)"
}
\`\`\`

Format example for projects with source code files:
[File: index.html]
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ...
  <script src="script.js"></script>
</body>
</html>
\`\`\`

[File: style.css]
\`\`\`css
/* Custom styles here */
\`\`\`

[File: script.js]
\`\`\`javascript
// Custom scripting here
\`\`\`

Landing Page Guidelines:
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

    if (skillContent) {
      systemInstruction += `\n\nCRITICAL UX/UI DESIGN & ENGINEERING RULES TO OBEY (From active skill guide):\n${skillContent}`;
    }

    let userPrompt = "";

    if (body.files && body.files.length > 0) {
      userPrompt = `You are refining an existing web project based on a new user instruction.
Current Project Files:
${body.files.map((f: FileEntry) => `[File: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join("\n\n")}

The user's instruction for this iteration is: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Please update the project files based on their instructions. You can add new HTML, CSS, or JS files, or modify/remove existing files.
Ensure you return the FULL updated files inside their respective \`[File: filename.ext]\` sections and code blocks. Do not truncate or use placeholders.
Describe the modifications and design reasoning in the thinking section at the start of your message.`;
    } else if (previousHtml) {
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
Ensure you return the FULL updated HTML document inside a \`[File: index.html]\` section and code block. Do not truncate or use placeholders.
Describe the modifications and design reasoning in the thinking section at the start of your message.`;
    } else {
      userPrompt = `Create a brand new web project. You can generate multiple files (e.g. index.html, style.css, script.js) to build a gorgeous landing page or multi-page experience.
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Make the design extremely modern, using grids, custom flex layouts, nice gradients, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `Model ${modelName} failed to initiate stream. Error:`,
          msg,
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
        } catch (e: unknown) {
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
  } catch (error: unknown) {
    console.error("Generate Website Stream API error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate website code";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
