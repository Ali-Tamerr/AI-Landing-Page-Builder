---
name: social-media-designing
description: Explains how to design premium, stunning, and professional-grade social media assets (banners, posts, thumbnails, posters) directly using image generation models. It instructs the agent to proactively search and visit top aesthetic design websites (Behance, Dribbble, Abduzeedo, etc.) for real-world designer inspiration, and provides advanced prompt-engineering recipes, styling modifiers, and layout formulas.
---

# Social Media Design via Real-World Inspiration & Image Generation

Use this skill when you are asked to generate high-quality, professional-grade social media graphics, banners, posters, thumbnails, or post assets using an image generation model. 

This skill enforces a **research-first design workflow** where you visit top-tier designer galleries and design showcase websites to gather real-world aesthetic inspiration, trends, and layouts before formulating prompt-engineering strategies.

---

## 1. Research & Inspiration Workflow (Visit Before Prompting)

To make generated images look like they came from an elite graphic designer, you must not rely on generic, pre-trained AI knowledge. You should proactively search the web or fetch content from top aesthetic portfolios and design hubs to see what real human designers are creating right now.

### Recommended Showcase Platforms & Search Queries

When starting a design task, use search tools (`search_web` or `read_url_content`) with specific, highly targeted queries to find contemporary styles, compositions, and color trends:

| Platform | Recommended Search Targets | Use For |
| :--- | :--- | :--- |
| **Behance / Dribbble** | `"minimalist poster design Behance"`, `"SaaS landing page 3D illustration Dribbble"`, `"high-end editorial design layout Behance"` | Modern compositions, layout placement, typography layout, and color combinations. |
| **Abduzeedo** | `https://abduzeedo.com` or `"editorial graphic design site:abduzeedo.com"` | Cutting-edge typography, brand identity, 3D art, retro-futurism, and digital illustration trends. |
| **Mindsparkle Mag** | `"branding graphic design site:mindsparklemag.com"` | Luxury, minimal, editorial design, and sophisticated layout hierarchies. |
| **Designspiration** | `"color palettes graphic design site:designspiration.com"` | Striking, curated color harmonies and graphic compositions. |

### How to Execute Your Inspiration Search

1.  **Search the Trend**: Search the platforms for the user's specific theme.
    *   *Example:* If designing an AI tool post, search: `"3D abstract fluid shapes design trend 2026 site:abduzeedo.com"`
2.  **Analyze & Transcribe**: From the search results or website text:
    *   Note the **exact color hex/HSL codes** used.
    *   Identify the **texture and lighting** style (e.g., "matte clay", "frosted glassmorphism", "grainy retro noise").
    *   Describe the **spatial composition** (e.g., "subject offset to the far left with oversized typographic overlap").
3.  **Translate to Prompts**: Feed these extracted real-world designer details directly into your image generation prompt.

---

## 2. Professional Composition & Layout Framing

A graphic designer always plans where the eye travels. When prompting, you must explicitly describe the layout, framing, and negative space.

*   **Rule of Thirds / Asymmetry**: Avoid centering everything. Place focal subjects on the left or right third of the frame.
    *   *Prompt directive:* `"Composition is split: key subject on the right-third of the frame, with the left-two-thirds dedicated to clean, uncluttered, solid-color negative space."`
*   **The Flat Lay (Knolling)**: Perfect for product posts, workspace setups, and organized toolkits.
    *   *Prompt directive:* `"A premium overhead flat lay (knolling photography), perfectly top-down view, symmetrically arranged items, sharp hard shadows on a solid matte neutral surface."`
*   **Minimalist Editorial**: Gives breathing room and feels high-end/luxurious.
    *   *Prompt directive:* `"Ultra-minimalist editorial design, vast negative space, high contrast, elegant asymmetrical layout, crisp and clean composition."`
*   **3D Isometric Render**: Excellent for tech, SaaS, diagrams, or showcasing abstract concepts.
    *   *Prompt directive:* `"Isometric 3D render, clean low-poly and smooth clay textures, floating abstract geometry, soft volumetric lighting, transparent glass elements."`

---

## 3. Curated Graphic Design Styles (Avoid Generic Prompts)

Do not use generic words like "beautiful", "highly detailed", or "graphic design". Instead, specify established art and design movements:

| Design Style | Aesthetic & Atmosphere | Key Prompt Modifiers |
| :--- | :--- | :--- |
| **Swiss Style / International Typographic** | Clean, structured, highly professional, objective. | `"Swiss graphic design style, clean grid alignment, asymmetrical layout, bold solid shapes, minimalist, high contrast, matte finish, pure colors."` |
| **Neo-Brutalism** | Trendy, high-energy, raw, digital-native, bold outline. | `"Neo-brutalist digital art style, thick black borders, flat vibrant colors, high-contrast grid, sticker-art elements, retro-digital aesthetic, playful geometry."` |
| **Premium 3D Glassmorphism** | Modern SaaS, futuristic, sleek, glowing. | `"3D render, translucent frosted glass layers, soft refractive light, glowing neon color gradients, floating abstract geometry, dark background, premium tech UI feel."` |
| **Retro-Futurism / Synthwave** | 80s/90s cyber aesthetic, nostalgic yet high-tech. | `"Retro-futuristic synthwave aesthetic, dark neon violet and electric pink grid, chrome reflective surfaces, wireframe mountains, soft dust scratch texture, sunset gradient."` |
| **Editorial Fashion / Luxury Minimalist** | High-end lifestyle, clean, beige/pastel, quiet luxury. | `"High-end editorial lookbook photography, soft diffused natural light, muted earth tones, warm shadows, minimalist beige background, premium quiet luxury aesthetic."` |

---

## 4. Mastering Colors, Lighting, & Textures

Professional designers never use default primary colors. To make generated images feel premium, specify exact harmonious color schemes and professional studio lighting setups:

*   **Vibrant Cyber Contrast**: 
    *   *Color:* `"A color palette of deep midnight indigo, electric violet, cyber cyan, and neon magenta highlights."`
    *   *Lighting:* `"Split rim-lighting with intense cyan on one side and deep purple glow on the other, volumetric fog, dark background."`
*   **Quiet Luxury / Warm Neutral**:
    *   *Color:* `"A sophisticated neutral color palette of warm beige, terracotta, sage green, and charcoal gray."`
    *   *Lighting:* `"Soft morning sun filtering through a window, casting natural leaf shadows (gobos) across the scene, gentle key light."`
*   **Monochromatic Glow**:
    *   *Color:* `"A monochromatic emerald green color scheme with varying shades of forest green, mint, and glowing neon green accents."`
    *   *Lighting:* `"Moody low-key lighting, ambient occlusion, glowing lines reflecting on dark metallic surfaces."`

---

## 5. Typography & Text Integration in Prompts

If you want the model to generate text directly on the image, follow these prompt-engineering rules:

1.  **Isolate the Text**: Enclose the target text in clear quotation marks and specify its style, position, and case.
2.  **Describe the Font Family**: Specify "sans-serif", "serif", "display", "bold geometric", or "elegant script".
3.  **Specify Flat and Solid Rendering**: Avoid bloated or warped 3D text unless specifically desired.
    *   *Example Prompt Fragment:* `"with the words 'FUTURE TECH' rendered in a clean, crisp, bold sans-serif geometric font, centered at the top of the card. The letters are solid matte white with no warping."`
4.  **Leaving Room for Post-Text**: Often, it is safer to generate an exquisite graphic *without* embedded text, leaving a dedicated blank region so the user can easily overlay text in their social media post editor.
    *   *Example Prompt Fragment:* `"The left side of the graphic is completely clear of objects, featuring a clean, flat, dark-grey background texture, designed as a copy-space area for overlaying text."`

---

## 6. Prompting Recipes Driven by Design Trends

### Recipe A: YouTube Thumbnail (High CTR, Tech & AI)
> **Prompt:** `"High-impact YouTube thumbnail design. On the right, a premium, highly detailed 3D rendering of a glowing holographic brain with intricate gold circuits and neon blue fiber optics. On the left, vast dark space with a subtle cybernetic grid pattern, leaving plenty of negative space. Dramatically lit with vibrant purple and cyan studio lights, deep shadows, ultra-clean render, high-contrast, modern graphic design style, cinematic composition."`

### Recipe B: LinkedIn / X Professional Banner (Minimalist SaaS/AI)
> **Prompt:** `"A sleek, professional banner optimized for LinkedIn. Aspect ratio 3:1. Beautiful abstract landscape of flowing, layered 3D wave ribbons in a gradient of frosted glass, royal blue, and satin silver. The ribbons gently float over a deep dark-grey matte background. Studio lighting, soft depth of field, minimalist tech aesthetic, clean and spacious, no clutter, premium corporate design, ultra-crisp composition."`

### Recipe C: Instagram Square Post (Lifestyle & Product Promo)
> **Prompt:** `"A premium Instagram post graphic. Modern flat-lay composition on a split terracotta and sand-colored concrete surface. In the center, a minimalist cosmetic bottle made of frosted glass with a matte black lid. A single monstera leaf shadow is cast diagonally across the surface. Soft, natural warm morning sunlight, elegant composition, high-end editorial graphic, neutral muted colors, clean and artistic."`

---

## 7. Design Inspiration Workflow Checklist

Before crafting any prompt for an image generation model:
- [ ] **Phase 1: Research Showcase**: Run a web search or read content from Behance, Dribbble, or Abduzeedo for the user's specific theme.
- [ ] **Phase 2: Extract Stylistic Properties**: Document real-world palette shades, lighting styles, typography setups, and physical layout designs.
- [ ] **Phase 3: Compose Prompt**: Synthesize the extracted styles into a structured, descriptive text-to-image prompt.
- [ ] **Phase 4: Contrast & Balance Check**: Ensure the prompt explicitly mandates solid contrast and clutter control so the generated image looks premium and neat.
