import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  /* 
    IMPORTANT: GitHub Pages is for static sites only. 
    The AI generation (API routes) will NOT work on GitHub Pages.
    Vercel is the recommended platform for this project as it supports API routes.
  */
  output: isGithubActions ? 'export' : undefined,
  
  // Update this with your GitHub repository name if deploying to GitHub Pages subpath
  basePath: isGithubActions ? '/ai-saas-landing-page' : undefined,
  
  images: {
    unoptimized: true, // Required for static export/GitHub Pages
  },
  
  // Ensure trailing slashes are consistent for static export
  trailingSlash: true,
};

export default nextConfig;
