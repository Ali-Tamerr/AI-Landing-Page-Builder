# Next.js AI Copywriting SaaS Landing Page

## Gemini CLI Implementation Prompt
Create a high-converting landing page for an AI copywriting platform using Next.js and Tailwind CSS[cite: 11]. The design should feature a dark-themed 'glassmorphism' aesthetic[cite: 11]. Key sections include a hero with a glowing call-to-action, a bento-grid feature showcase, a pricing toggle, and a FAQ accordion[cite: 11]. Use your ui-ux-pro-max-skill to ensure the typography is premium and the spacing follows a strict 8pt grid system[cite: 11]. Include smooth scroll animations using Framer Motion[cite: 11].

## UI/UX Flow for AI SaaS Landing Page

### 1. Hero & Conversion (Entry)
- **Screen**: `Hero.tsx`
- **Flow**: Background grain effect → Headline entrance → Visual demo of AI output → Primary CTA.
- **Tech**: Framer Motion, Tailwind text-gradients.

### 2. Live Playground (Interactive)
- **Component**: `AiPlayground.tsx`
- **Flow**: Input box → Loading state with glowing borders → "Typed" AI response simulation.
- **Color Palette**: Background: `#020617`, Primary: `#8b5cf6` (Violet).

### 3. Feature Discovery (Bento Grid)
- **Component**: `FeatureGrid.tsx`
- **Structure**: Multi-size grid cards highlighting SEO, multi-language, and social media tools.
- **Tech**: `backdrop-blur-xl`, Tailwind `hover:border-primary`.

### 4. Pricing Toggle
- **Component**: `PricingToggle.tsx`
- **Flow**: Monthly/Yearly switch → Price cards update with spring physics.
- **Color Palette**: Accent: `#22d3ee` (Cyan), Success: `#10b981`.

## Route Map
/               - Main Landing Page
/pricing        - Detailed Plan Comparison
/login          - User Authentication
/register       - Signup Flow


## Component Map
LandingLayout
├── Navbar (Sticky/Glass)
├── HeroSection
├── LivePlayground
├── BentoFeatureGrid
├── TestimonialMarquee
├── PricingSection
└── FaqAccordion


## Color Palette (Deep Space Theme)
```css
:root {
  --color-bg: #020617;        /* Slate 950 */
  --color-surface: #0f172a;   /* Slate 900 */
  --color-primary: #8b5cf6;   /* Violet 500 */
  --color-accent: #22d3ee;    /* Cyan 400 */
  --color-text: #f8fafc;      /* Slate 50 */
}

Tailwind Configuration
TypeScript

theme: {
  extend: {
    colors: {
      brand: {
        dark: '#020617',
        primary: '#8b5cf6',
        cyan: '#22d3ee',
      },
    },
    backgroundImage: {
      'radial-glow': 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 80%)',
    },
  },
}
API Endpoints (Mock)
TypeScript

/api/demo/generate      POST - Mock AI text generation
/api/auth/register      POST - Lead capture
/api/billing/rates      GET  - Dynamic pricing fetch
Key Features
Responsive Mastery: Fluid layout from mobile to 4K displays.

Performance: 100/100 Lighthouse score via Next.js Image and font optimization.

Accessibility: ARIA labels for all interactive elements.

Dependencies
next
tailwindcss
framer-motion
lucide-react
clsx
tailwind-merge