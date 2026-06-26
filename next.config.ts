import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig: NextConfig = {
  /*
    Static export is only for GitHub Pages-style hosting.
    Cloudflare/OpenNext deploys run inside GitHub Actions too, so do not use
    GITHUB_ACTIONS as the export switch. Set NEXT_OUTPUT_EXPORT=true only when
    intentionally building a static export; dynamic API routes will not work there.
  */
  output: isStaticExport ? "export" : undefined,

  // Update this with your GitHub repository name if deploying to GitHub Pages subpath.
  basePath: isStaticExport ? "/ai-saas-landing-page" : undefined,

  images: {
    unoptimized: isStaticExport,
  },

  // Keep route output stable across Cloudflare and optional static exports.
  trailingSlash: true,

  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: (() => {
      console.log("BUILD TIME: NEXT_PUBLIC_FIREBASE_API_KEY =", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
      return process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
    })(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore firebase on the server to prevent EvalErrors in Cloudflare Workers
      config.resolve.alias["firebase/app"] = false;
      config.resolve.alias["firebase/auth"] = false;
      config.resolve.alias["firebase/firestore"] = false;
    }
    return config;
  },

  turbopack: {},
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) =>
    m.initOpenNextCloudflareForDev(),
  );
}
