import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

interface FileEntry {
  name: string;
  language: string;
  content: string;
}

interface ChatMessageEntry {
  sender: "user" | "assistant";
  text: string;
}

const formatChatHistory = (messages: ChatMessageEntry[] = []) => {
  return messages
    .slice(-12)
    .map(
      (message) =>
        `${message.sender === "user" ? "User" : "Builder AI"}: ${message.text}`,
    )
    .join("\n\n");
};

const readSkillMarkdownFallback = (skillDir: string, selectedSkill: string) => {
  const candidates = [
    path.join(skillDir, "SKILL.md"),
    path.join(
      process.cwd(),
      "skills",
      `${selectedSkill.replace(".md", "")}.md`,
    ),
    path.join(process.cwd(), "skills", selectedSkill),
  ];

  return candidates
    .filter((candidate) => {
      try {
        return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
      } catch {
        return false;
      }
    })
    .map((candidate) => fs.readFileSync(candidate, "utf-8"))
    .join("\n\n");
};

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
      generationMode = "build",
      chatHistory = [],
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conversationContext = formatChatHistory(
      chatHistory as ChatMessageEntry[],
    );

    let skillContent = "";
    if (selectedSkill) {
      try {
        // Check if this is a directory-based skill (e.g. ui-ux-pro-max with scripts/search.py)
        const normalizedSkill = selectedSkill.replace(".md", "");
        const skillDir = path.join(process.cwd(), "skills", normalizedSkill);
        const scriptPath = path.join(skillDir, "scripts", "search.py");

        if (fs.existsSync(scriptPath)) {
          const searchQuery =
            `${prompt} ${conversationContext} ${tone} ${targetAudience}`
              .replace(/\s+/g, " ")
              .slice(0, 500);
          try {
            skillContent = execFileSync(
              "python",
              [scriptPath, searchQuery, "--design-system", "-f", "markdown"],
              { cwd: process.cwd(), timeout: 15000, encoding: "utf-8" },
            );
            console.log("ui-ux-pro-max design system fetched successfully.");
          } catch (scriptErr: unknown) {
            const msg =
              scriptErr instanceof Error
                ? scriptErr.message
                : String(scriptErr);
            console.warn(
              "Python skill script failed, falling back to markdown rules:",
              msg,
            );
            skillContent = readSkillMarkdownFallback(skillDir, selectedSkill);
          }
        } else {
          skillContent = readSkillMarkdownFallback(skillDir, selectedSkill);
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
You support creating clean, modular projects with as many files and folders as necessary. For static builds, do not default to only index.html, style.css, and script.js; split code into meaningful HTML pages, CSS modules, JavaScript modules, and asset folders when it improves maintainability.
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

Format example for modular static projects:
[File: index.html]
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/home.css">
</head>
<body>
  ...
  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
\`\`\`

[File: pages/about.html]
\`\`\`html
<!-- Additional page when the project needs one -->
\`\`\`

[File: assets/css/base.css]
\`\`\`css
/* Design tokens, reset, typography, shared layout primitives */
\`\`\`

[File: assets/css/home.css]
\`\`\`css
/* Page-specific sections and responsive styling */
\`\`\`

[File: assets/js/main.js]
\`\`\`javascript
// App shell interactions and shared utilities
\`\`\`

[File: assets/js/navigation.js]
\`\`\`javascript
// Navigation, menus, in-page scrolling, and active states
\`\`\`

Landing Page Guidelines:
- Do NOT use Tailwind CSS, Bootstrap, React, Vue, Angular, Next.js, or any other framework/library by default. Only use a tool/library if the user explicitly selected it in the interview or asked for it in the prompt.
- If no tool/library choice is available, default to vanilla HTML, modern custom CSS, and small modular JavaScript files.
- Include a modern premium font setup when it improves the design, but keep dependencies intentional and minimal.
- Image reliability is mandatory. Do not use random or guessed image URLs. If the user did not provide real image URLs/assets, prefer CSS/SVG visual treatments, inline SVG illustrations, gradients, or stable royalty-free remote images with descriptive alt text. Every '<img>' must include meaningful 'alt', explicit dimensions or aspect-ratio styling, 'loading="lazy"' where appropriate, and an 'onerror' fallback or JS fallback that replaces broken images with a designed placeholder.
- If the design needs product/portfolio imagery but no reliable assets are available, create polished CSS/SVG placeholders that match the brand instead of emitting fragile external image URLs.
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
- Use semantic file organization. Prefer folders such as \`pages/\`, \`assets/css/\`, \`assets/js/\`, \`assets/data/\`, and \`components/\` when the project is large enough to benefit from them.
- Keep shared styles, page-specific styles, and behavior separated. Avoid dumping all styling and scripting into one file unless the project is truly tiny.
- Ensure the layout is 100% responsive, uses semantic tags, and has complete, high-quality copywriting (never use empty layout placeholders or lorem ipsum).`;

    if (skillContent) {
      systemInstruction += `\n\nCRITICAL UX/UI DESIGN & ENGINEERING RULES TO OBEY (From active skill guide):\n${skillContent}`;
    }

    if (generationMode === "interview") {
      const grillMePath = path.join(process.cwd(), "skills", "grill-me.md");
      if (fs.existsSync(grillMePath)) {
        systemInstruction += `\n\nACTIVE INTERVIEW SKILL RULES (grill-me):\n${fs.readFileSync(grillMePath, "utf-8")}`;
      }
    }

    let userPrompt = "";

    if (generationMode === "interview") {
      systemInstruction += `

ACTIVE MODE: GRILL-ME INTERVIEW.
You are NOT allowed to generate website files yet.
Do NOT output [File: ...] blocks, HTML, CSS, JavaScript, or implementation code.
Ask exactly ONE next question that resolves the most important missing requirement before building.
Use this interview order: product goal, exact audience, tools/libraries/stack, image/assets source, brand personality, page sections/content flow, visual theme, interactions.
You MUST ask one tools/libraries question before building if the conversation does not already specify the implementation stack. That question should let the user choose between options such as vanilla HTML/CSS/JS, React, Vue, Angular, Next.js + TypeScript, plus CSS approach choices like custom CSS, Tailwind CSS, or Bootstrap.
You SHOULD ask an image/assets source question before building if the site depends on product, portfolio, team, gallery, or hero imagery and the user has not provided image URLs/assets. Recommend reliable provided assets or designed SVG/CSS placeholders over fragile guessed remote URLs.
Each question must include 3-4 concrete options and one recommendation derived from the active UI/UX skill rules. For the tools/libraries question, highlight the best suitable option via the \`recommendation\` field.
Return only a short lead-in sentence and one \`\`\`question JSON block.
The question block must contain strict valid JSON only: double-quoted keys, double-quoted string values, no trailing commas, no comments, and escaped quotes inside strings.`;

      userPrompt = `Interview the user before building a landing page.
Original/latest user input: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Conversation so far:
${conversationContext || "No previous interview answers yet."}

Ask the single next best question. If the user has not chosen tools/libraries yet, ask that stack/tools question now. If the implementation stack is already clear but image/assets source is unclear for an image-heavy site, ask the image/assets question next. Do not build yet.`;
    } else if (body.files && body.files.length > 0) {
      userPrompt = `You are refining an existing web project based on a new user instruction.
Current Project Files:
${body.files.map((f: FileEntry) => `[File: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join("\n\n")}

The user's instruction for this iteration is: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Please update the project files based on their instructions. You can add new files, folders, HTML pages, CSS modules, JavaScript modules, or framework files when the selected stack calls for it.
Do not collapse the project back into only index.html, style.css, and script.js unless the user explicitly asks for a tiny single-page static site.
Do not introduce Tailwind CSS, Bootstrap, React, Vue, Angular, Next.js, or any other library unless it was already selected or requested.
Audit any '<img>' or CSS background image you add or keep: avoid broken/guessed URLs, add alt text, sizing, lazy loading where appropriate, and a fallback for failures.
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

Please update the landing page based on their instructions. If the page has grown beyond a tiny one-file demo, split the result into clean files and folders instead of returning only one monolithic HTML document.
Do not introduce Tailwind CSS, Bootstrap, React, Vue, Angular, Next.js, or any other library unless it was already selected or requested.
Audit any '<img>' or CSS background image you add or keep: avoid broken/guessed URLs, add alt text, sizing, lazy loading where appropriate, and a fallback for failures.
Ensure you return the FULL updated files inside \`[File: filename.ext]\` sections and code blocks. Do not truncate or use placeholders.
Describe the modifications and design reasoning in the thinking section at the start of your message.`;
    } else {
      userPrompt = `Create a brand new web project using the stack/tools selected during the interview. For vanilla HTML/CSS/JS projects, generate a clean folder structure and multiple focused files when appropriate, not just index.html, style.css, and script.js.
Product/Service Description: "${prompt}"
Tone of Voice: "${tone}"
Color Theme Style: "${colorTheme}"
Target Audience: "${targetAudience}"

Interview answers and prior context:
${conversationContext || "No prior interview context was provided."}

Before writing files, synthesize the interview answers into a clear design direction and implementation plan. Respect the user's selected stack, CSS approach, and image/assets preference. If the user did not select Tailwind CSS or Bootstrap, write custom CSS instead of using those libraries. If the user did not provide reliable image assets, use designed CSS/SVG placeholders or stable royalty-free image sources with robust fallbacks instead of guessed URLs.
Apply the active UI/UX skill rules as hard constraints: use a coherent premium design system, strong contrast, professional SVG icons instead of emojis, polished spacing, clear conversion flow, and responsive semantic layout.
Make the design extremely modern, using grids, custom flex layouts, refined gradients only where they serve the brand, beautiful interactive card hovering animations, and high contrast. Let the copy sell the value proposition elegantly.`;
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
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate website code";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
