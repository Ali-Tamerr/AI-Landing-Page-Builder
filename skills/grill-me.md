---
name: grill-me
description: Interactive design and implementation interview helper to align on project requirements
---
# grill-me

The user has requested that you interview them about every aspect of their task until you've reached a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

## Guidelines
- Ask the questions one at a time.
- If a question can be answered by exploring the codebase, explore the codebase instead.
- Use the ask_question tool for asking questions to the user.

---

## The Design Tree Decision Branches

To arrive at a premium, cohesive implementation, resolve decisions in the following sequence:

### 1. Product Identity & Purpose
- What is the primary conversion goal? (e.g., signup, download, purchase, trial)
- Who is the exact target audience? (e.g., developers, consumers, enterprise execs)
- What is the desired brand personality? (e.g., high-tech, organic/warm, dark-minimal, playful)

### 2. Layout & Content Strategy
- What sections are required on the page?
- How should the content flow? (e.g., Hero -> Problem -> Features -> Testimonials -> Pricing -> CTA)
- Are there specific interactive sections needed? (e.g., accordions, sliders, tab switchers)

### 3. Aesthetics & Theme
- Color Theme: Which primary accent, secondary accent, and background tones best match the brand?
- Typography: Which high-end Google Font pairing (e.g., Outfit + Inter) fits the identity?
- Visual style: Glassmorphism, flat minimalist, neo-brutalism, or standard corporate card-grid?

### 4. Interactive Components & Micro-interactions
- How should buttons and cards respond to hover and active states?
- What micro-animations should accompany user actions?

---

## How to Conduct the Interview

1. **Step-by-step Execution**: Begin at Branch 1 (Product Identity). Ask one question at a time. Do not overwhelm the user with a giant list of questions.
2. **Provide Recommendations**: For every question you ask, offer a recommended option based on best practices from `ui-ux-pro-max` (e.g., "I recommend using HSL Violet-to-Indigo gradients with a deep space background for a modern SaaS tool...").
3. **Continuous Codebase Context**: Check the current files in the workspace (like index.html, register/page.tsx, etc.) to adapt the interview to existing style/layouts.
