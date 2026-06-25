"use client";
/* eslint-disable react-hooks/purity */

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Menu,
  X,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Info,
  Globe,
  FileText,
  FileJson,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";

// Official language logo marks for file tabs.
const HtmlIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 512 512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path fill="#E44D26" d="M71 460 30 0h452l-41 460-185 52" />
    <path fill="#F16529" d="m256 472 149-41 35-394H256" />
    <path
      fill="#EBEBEB"
      d="M256 208h-75l-5-58h80V94H115l15 171h126zm0 143h-1l-63-17-4-44h-56l8 87 115 32h1z"
    />
    <path
      fill="#FFF"
      d="M255 208v57h70l-7 69-63 17v58l116-32 1-10 15-159zm0-114v56h137l5-56z"
    />
  </svg>
);

const CssIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 512 512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path fill="#1572B6" d="M71 460 30 0h452l-41 460-185 52" />
    <path fill="#33A9DC" d="m256 472 149-41 35-394H256" />
    <path
      fill="#FFF"
      d="M392 94H255v56h80l-5 58h-75v57h69l-6 69-63 17v58l116-32 1-10 11-126 1-13z"
    />
    <path
      fill="#EBEBEB"
      d="M255 94H115l5 56h135zm0 114H125l5 57h125zm0 143h-1l-62-17-4-44h-56l8 87 115 32z"
    />
  </svg>
);

const JsIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path fill="#F7DF1E" d="M0 0h24v24H0z" />
    <path
      fill="#000"
      d="M22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9l1.755-1.125c-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65zM13.051 11.031h-2.248v5.805c0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179z"
    />
  </svg>
);

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  createdAt: number;
}

type ProjectFileLanguage =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "vue"
  | "json"
  | "markdown";

interface ProjectFile {
  name: string;
  content: string;
  language: ProjectFileLanguage;
}

interface WebProject {
  id: string;
  title: string;
  prompt: string;
  tone: string;
  colorTheme: string;
  targetAudience: string;
  landingPageHtml: string;
  files?: ProjectFile[];
  activeFileName?: string;
  messages: ChatMessage[];
  createdAt: number;
}

const BUILD_STEPS = [
  "Synthesizing interview answers...",
  "Generating a design-system direction...",
  "Drafting semantic page structure...",
  "Applying the selected styling system...",
  "Rendering finalized website preview...",
];

const MIN_INTERVIEW_QUESTIONS = 4;

const hasImplementationStackChoice = (
  messages: ChatMessage[],
  prompt: string,
) => {
  const text = [...messages.map((message) => message.text), prompt]
    .join("\n")
    .toLowerCase();

  return /\b(html|css|javascript|vanilla|react|vue|angular|next\.js|nextjs|typescript|tailwind|bootstrap|custom css)\b/.test(
    text,
  );
};

const countInterviewQuestions = (messages: ChatMessage[]) => {
  return messages.filter((message) => {
    return (
      message.sender === "assistant" && message.text.includes("```question")
    );
  }).length;
};

const shouldForceBuild = (prompt: string) => {
  return /\b(build|generate|create|ship|make it|start building|proceed)\b/i.test(
    prompt,
  );
};

function BuildProgressIndicator({ step }: { step: number }) {
  return (
    <div className="space-y-2.5 bg-gray-55/60 p-5 rounded-2xl border border-gray-150 text-left max-w-sm mx-auto shadow-xs">
      {BUILD_STEPS.map((text, idx) => {
        const isCurrent = idx === step;
        const isCompleted = idx < step;
        return (
          <div
            key={idx}
            className="flex items-center gap-3 text-xs transition-opacity duration-300"
          >
            {isCompleted ? (
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold text-[9px] shrink-0">
                ✓
              </span>
            ) : isCurrent ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
            )}
            <span
              className={`font-semibold truncate ${
                isCompleted
                  ? "text-gray-400 line-through decoration-gray-300"
                  : isCurrent
                    ? "text-brand-primary"
                    : "text-gray-500"
              }`}
            >
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
        active
          ? "bg-white text-gray-900 shadow-3xs"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface ViewportButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

function ViewportButton({ active, onClick, icon, title }: ViewportButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all ${
        active
          ? "bg-white text-brand-primary shadow-3xs"
          : "text-gray-400 hover:text-gray-700"
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

interface FileTabButtonProps {
  fileName: string;
  active: boolean;
  onClick: () => void;
  variant?: "light" | "dark";
}

function FileTabButton({
  fileName,
  active,
  onClick,
  variant = "light",
}: FileTabButtonProps) {
  const isHtml = fileName.endsWith(".html");
  const isCss = fileName.endsWith(".css");
  const isJs = fileName.endsWith(".js") || fileName.endsWith(".javascript");
  const isJson = fileName.endsWith(".json");

  const renderIcon = () => {
    if (isHtml) return <HtmlIcon className="w-3.5 h-3.5 shrink-0" />;
    if (isCss) return <CssIcon className="w-3.5 h-3.5 shrink-0" />;
    if (isJs) return <JsIcon className="w-3.5 h-3.5 rounded-xs shrink-0" />;
    if (isJson)
      return (
        <FileJson
          className={`w-3.5 h-3.5 shrink-0 ${variant === "dark" ? "text-purple-400" : "text-purple-600"}`}
        />
      );
    return (
      <FileText
        className={`w-3.5 h-3.5 shrink-0 ${variant === "dark" ? "text-slate-400" : "text-gray-400"}`}
      />
    );
  };

  const className =
    variant === "dark"
      ? `w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
          active
            ? "bg-slate-900 text-brand-primary border-l-2 border-brand-primary rounded-l-none"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
        }`
      : `px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
          active
            ? "bg-brand-primary/10 border-brand-primary text-brand-primary font-bold shadow-3xs"
            : "bg-white border-brand-border text-gray-600 hover:text-gray-900"
        }`;

  return (
    <button onClick={onClick} className={className}>
      {renderIcon()}
      <span className="truncate">{fileName}</span>
    </button>
  );
}

function parseStreamingMarkdown(text: string) {
  const files: ProjectFile[] = [];

  // Regex to match [File: filename.ext] followed by code blocks
  const fileRegex =
    /\[File:\s*([^\]]+)\][\s\r\n]*```(html|css|javascript|js|typescript|ts|jsx|tsx|vue|json|markdown|md)[\s\r\n]*([\s\S]*?)(?:```|$)/gi;

  let match;
  let thinking = "";

  const firstMatchIndex = text.search(/\[File:\s*[^\]]+\]/i);
  if (firstMatchIndex !== -1) {
    thinking = text.substring(0, firstMatchIndex).trim();
  } else {
    // Backward compatibility check for normal ```html blocks without [File: filename.ext]
    const codeBlockStart = "```html";
    const startIdx = text.indexOf(codeBlockStart);
    if (startIdx !== -1) {
      thinking = text.substring(0, startIdx).trim();
      let html = text.substring(startIdx + codeBlockStart.length);
      const endIdx = html.indexOf("```");
      if (endIdx !== -1) {
        html = html.substring(0, endIdx);
      }
      return {
        thinking,
        files: [
          {
            name: "index.html",
            content: html.trim(),
            language: "html" as const,
          },
        ],
      };
    }
    return {
      thinking: text,
      files: [],
    };
  }

  while ((match = fileRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    let lang = match[2].toLowerCase();
    if (lang === "js") lang = "javascript";
    if (lang === "ts") lang = "typescript";
    if (lang === "md") lang = "markdown";
    const fileContent = match[3].trim();

    files.push({
      name: fileName,
      content: fileContent,
      language: lang as ProjectFileLanguage,
    });
  }

  return {
    thinking,
    files,
  };
}

function compileProjectPreview(
  files: ProjectFile[],
  activeFileName: string = "index.html",
): string {
  const activeFile =
    files.find((f) => f.name === activeFileName) ||
    files.find((f) => f.name.endsWith(".html")) ||
    files[0];
  if (!activeFile) return "";
  if (activeFile.language !== "html") {
    // Render source code preview or styling if active file is CSS/JS directly
    return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-slate-100 p-6 font-mono text-sm whitespace-pre-wrap"><h2>${activeFile.name}</h2><hr class="border-slate-800 my-4" /><code>${activeFile.content}</code></body></html>`;
  }

  let htmlContent = activeFile.content;

  // Resolve relative CSS files link: <link rel="stylesheet" href="style.css">
  htmlContent = htmlContent.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    (match, href) => {
      const cssFile = files.find(
        (f) => f.name === href || f.name.endsWith("/" + href),
      );
      if (cssFile) {
        return `<style data-file="${href}">${cssFile.content}</style>`;
      }
      return match;
    },
  );

  // Resolve relative JS files script: <script src="script.js"></script>
  htmlContent = htmlContent.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src) => {
      const jsFile = files.find(
        (f) => f.name === src || f.name.endsWith("/" + src),
      );
      if (jsFile) {
        return `<script data-file="${src}">${jsFile.content}</script>`;
      }
      return match;
    },
  );

  const localHtmlFiles = files
    .filter((file) => file.language === "html" || file.name.endsWith(".html"))
    .map((file) => file.name);

  // Keep generated-site navigation inside the preview iframe. Models often emit
  // section links as "FAQ", "/faq", or extensionless page links like "about".
  // Without interception, srcDoc can resolve those against /playground/.
  const linkInterceptorScript = `
<script>
  (function () {
    var localHtmlFiles = ${JSON.stringify(localHtmlFiles)};

    function slug(value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\\.[a-z0-9]+$/, '')
        .replace(/^[/#]+/, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    function cleanHref(href) {
      return href.trim().split('#')[0].split('?')[0].replace(/^\\.\\//, '').replace(/^\\/+/, '');
    }

    function findLocalFile(href) {
      var clean = cleanHref(href) || 'index.html';
      var candidates = [clean, clean + '.html', clean.replace(/\\/$/, '') + '/index.html'];
      for (var i = 0; i < candidates.length; i++) {
        var candidate = candidates[i].toLowerCase();
        for (var j = 0; j < localHtmlFiles.length; j++) {
          if (localHtmlFiles[j].toLowerCase() === candidate) return localHtmlFiles[j];
        }
      }
      return null;
    }

    function sectionTokens(rawHref, linkText) {
      var raw = rawHref.trim();
      var sectionId = raw.indexOf('#') >= 0 ? raw.slice(raw.indexOf('#') + 1) : raw;
      sectionId = sectionId.split('?')[0].split('#')[0].replace(/^\\/+/, '').trim();
      var tokens = [sectionId, linkText || ''];
      try { tokens.push(decodeURIComponent(sectionId)); } catch (_) {}
      return tokens.map(slug).filter(Boolean);
    }

    function findSection(rawHref, linkText) {
      var tokens = sectionTokens(rawHref, linkText);
      if (!tokens.length) return null;

      var idElements = Array.prototype.slice.call(document.querySelectorAll('[id], [name]'));
      for (var i = 0; i < idElements.length; i++) {
        var el = idElements[i];
        var idSlug = slug(el.getAttribute('id') || el.getAttribute('name'));
        if (tokens.indexOf(idSlug) !== -1) return el;
      }

      var headings = Array.prototype.slice.call(document.querySelectorAll('main h1, main h2, main h3, main h4, section h1, section h2, section h3, section h4, h1, h2, h3, h4'));
      for (var h = 0; h < headings.length; h++) {
        var heading = headings[h];
        var headingSlug = slug(heading.textContent || '');
        for (var t = 0; t < tokens.length; t++) {
          if (headingSlug === tokens[t] || headingSlug.indexOf(tokens[t]) !== -1 || tokens[t].indexOf(headingSlug) !== -1) {
            return heading.closest('section, article, main > div') || heading;
          }
        }
      }

      return null;
    }

    function scrollToTarget(section) {
      if (!section) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('click', function(e) {
      var target = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!target) return;

      var href = target.getAttribute('href');
      if (!href) return;

      var rawHref = href.trim();
      var lowerHref = rawHref.toLowerCase();

      if (
        lowerHref.startsWith('mailto:') ||
        lowerHref.startsWith('tel:') ||
        lowerHref.startsWith('javascript:') ||
        lowerHref.startsWith('data:') ||
        lowerHref.startsWith('http://') ||
        lowerHref.startsWith('https://') ||
        lowerHref.startsWith('//')
      ) {
        return;
      }

      var targetFile = findLocalFile(rawHref);
      if (targetFile) {
        e.preventDefault();
        window.parent.postMessage({ type: 'PREVIEW_NAVIGATE', fileName: targetFile }, '*');
        return;
      }

      var looksLikeSectionLink =
        rawHref === '/' ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('/#') ||
        /^\\/?[A-Za-z0-9 _-]+$/.test(rawHref);

      if (looksLikeSectionLink) {
        e.preventDefault();
        if (rawHref === '/' || rawHref === '#' || rawHref === '#top') {
          scrollToTarget(null);
          return;
        }

        scrollToTarget(findSection(rawHref, target.textContent || ''));
      }
    }, true);
  })();
</script>
`;

  return /<\/body>/i.test(htmlContent)
    ? htmlContent.replace(/<\/body>/i, `${linkInterceptorScript}</body>`)
    : htmlContent + linkInterceptorScript;
}

function CodeHighlighter({
  code,
  language,
  onChange,
}: {
  code: string;
  language: string;
  onChange: (val: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const highlightCode = (codeText: string, lang: string) => {
    if (lang === "html") {
      const parts = [];
      const regex =
        /(<!--[\s\S]*?-->)|(<script[\s\S]*?>[\s\S]*?<\/script>)|(<style[\s\S]*?>[\s\S]*?<\/style>)|(<[^>]+>)|([^<]+)/gi;
      let match;
      let i = 0;

      while ((match = regex.exec(codeText)) !== null) {
        if (match[1]) {
          parts.push(
            <span key={i++} className="text-slate-500 italic">
              {match[1]}
            </span>,
          );
        } else if (match[2]) {
          parts.push(
            <span key={i++} className="text-amber-200">
              {match[2]}
            </span>,
          );
        } else if (match[3]) {
          parts.push(
            <span key={i++} className="text-teal-200">
              {match[3]}
            </span>,
          );
        } else if (match[4]) {
          const tag = match[4];
          const tagRegex =
            /(<\/?)([a-zA-Z0-9:-]+)|(\s+([a-zA-Z0-9:-]+)\s*=\s*(["'])(.*?)\5)|(>)/g;
          let tagMatch;
          const tagParts = [];
          let lastIdx = 0;
          let k = 0;

          while ((tagMatch = tagRegex.exec(tag)) !== null) {
            if (tagMatch.index > lastIdx) {
              tagParts.push(tag.substring(lastIdx, tagMatch.index));
            }
            if (tagMatch[1]) {
              tagParts.push(
                <span key={k++} className="text-slate-500">
                  &lt;{tagMatch[1].slice(1)}
                </span>,
              );
              tagParts.push(
                <span key={k++} className="text-pink-400 font-bold">
                  {tagMatch[2]}
                </span>,
              );
            } else if (tagMatch[3]) {
              tagParts.push(" ");
              tagParts.push(
                <span key={k++} className="text-sky-300">
                  {tagMatch[4]}
                </span>,
              );
              tagParts.push(
                <span key={k++} className="text-slate-400">
                  =
                </span>,
              );
              tagParts.push(
                <span key={k++} className="text-emerald-300">
                  &quot;{tagMatch[6]}&quot;
                </span>,
              );
            } else if (tagMatch[7]) {
              tagParts.push(
                <span key={k++} className="text-slate-500">
                  &gt;
                </span>,
              );
            }
            lastIdx = tagRegex.lastIndex;
          }
          if (lastIdx < tag.length) {
            tagParts.push(tag.substring(lastIdx));
          }
          parts.push(<span key={i++}>{tagParts}</span>);
        } else if (match[5]) {
          parts.push(match[5]);
        }
      }
      return parts;
    }

    if (lang === "css") {
      const parts = [];
      const cssRegex =
        /(\/\*[\s\S]*?\*\/)|([^{}\s]+)\s*({)|([^:]+)\s*:\s*([^;]+)\s*(;)|(})/g;
      let match;
      let i = 0;

      while ((match = cssRegex.exec(codeText)) !== null) {
        if (match[1]) {
          parts.push(
            <span key={i++} className="text-slate-500 italic">
              {match[1]}
            </span>,
          );
        } else if (match[2]) {
          parts.push(
            <span key={i++} className="text-amber-300 font-semibold">
              {match[2]}
            </span>,
          );
          parts.push(
            <span key={i++} className="text-slate-400">
              {" "}
              {match[3]}
            </span>,
          );
        } else if (match[4]) {
          parts.push(
            <span key={i++} className="text-sky-300">
              {" "}
              {match[4]}
            </span>,
          );
          parts.push(
            <span key={i++} className="text-slate-400">
              :{" "}
            </span>,
          );
          parts.push(
            <span key={i++} className="text-orange-300">
              {match[5]}
            </span>,
          );
          parts.push(
            <span key={i++} className="text-slate-400">
              ;
            </span>,
          );
        } else if (match[7]) {
          parts.push(
            <span key={i++} className="text-slate-400">
              {match[7]}
            </span>,
          );
        }
      }
      return parts.length > 0 ? parts : [codeText];
    }

    if (lang === "javascript") {
      const parts = [];
      const jsRegex =
        /(\/\/.*|\/\*[\s\S]*?\*\/)|(["'`].*?["'`])|(\b(const|let|var|function|return|import|export|class|default|if|else|for|while|new|async|await|try|catch|throw)\b)|(\b(console|window|document|process|Array|Object|String|Number|Boolean|Function|Symbol|Promise|Map|Set)\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*(?=\()\.?\b)|(\b[0-9]+\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)|([{}()\[\];,])/g;
      let match;
      let i = 0;
      let lastIndex = 0;

      while ((match = jsRegex.exec(codeText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(codeText.substring(lastIndex, match.index));
        }

        if (match[1]) {
          parts.push(
            <span key={i++} className="text-slate-500 italic">
              {match[1]}
            </span>,
          );
        } else if (match[2]) {
          parts.push(
            <span key={i++} className="text-emerald-300">
              {match[2]}
            </span>,
          );
        } else if (match[3]) {
          parts.push(
            <span key={i++} className="text-pink-400 font-bold">
              {match[3]}
            </span>,
          );
        } else if (match[5]) {
          parts.push(
            <span key={i++} className="text-cyan-400 font-semibold">
              {match[5]}
            </span>,
          );
        } else if (match[7]) {
          parts.push(
            <span key={i++} className="text-amber-300">
              {match[7]}
            </span>,
          );
        } else if (match[8]) {
          parts.push(
            <span key={i++} className="text-purple-400">
              {match[8]}
            </span>,
          );
        } else if (match[9]) {
          parts.push(match[9]);
        } else if (match[10]) {
          parts.push(
            <span key={i++} className="text-slate-400">
              {match[10]}
            </span>,
          );
        }

        lastIndex = jsRegex.lastIndex;
      }

      if (lastIndex < codeText.length) {
        parts.push(codeText.substring(lastIndex));
      }
      return parts;
    }

    return [codeText];
  };

  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 1);

  const textStyles: React.CSSProperties = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "12px",
    lineHeight: "20px",
    tabSize: 2,
    color: "#e2e8f0",
  };

  return (
    <div className="flex-1 flex flex-row bg-slate-950 overflow-hidden relative min-h-0">
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className="select-none text-right pr-3 pl-4 text-slate-600 bg-slate-950 border-r border-slate-900 select-none shrink-0 min-w-[3.5rem] overflow-y-hidden py-4 scrollbar-none"
        style={{ ...textStyles }}
      >
        {Array.from({ length: lineCount }).map((_, idx) => (
          <div key={idx} style={{ height: "20px" }}>
            {idx + 1}
          </div>
        ))}
      </div>

      {/* Editor & Highlight Container */}
      <div className="flex-1 relative overflow-hidden h-full">
        {/* Transparent Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none focus:ring-0 overflow-auto whitespace-pre z-10 font-medium"
          style={{
            ...textStyles,
            WebkitTextFillColor: "transparent",
          }}
          spellCheck={false}
        />
        {/* Syntax Highlighted View */}
        <pre
          ref={preRef}
          className="absolute inset-0 w-full h-full p-4 pointer-events-none overflow-hidden whitespace-pre bg-transparent m-0 scrollbar-none"
          style={{ ...textStyles }}
        >
          <code style={{ ...textStyles }}>{highlightCode(code, language)}</code>
        </pre>
      </div>
    </div>
  );
}

interface QuestionData {
  question: string;
  options: string[];
  recommendation?: string;
}

function parseQuestionData(raw: string): QuestionData | null {
  try {
    const data = JSON.parse(raw.trim()) as Partial<QuestionData>;
    if (
      typeof data.question !== "string" ||
      !Array.isArray(data.options) ||
      data.options.some((option) => typeof option !== "string")
    ) {
      return null;
    }

    return {
      question: data.question,
      options: data.options,
      recommendation:
        typeof data.recommendation === "string"
          ? data.recommendation
          : undefined,
    };
  } catch {
    return null;
  }
}

function InteractiveQuestionCard({
  data,
  isAnswered,
  answeredValue,
  onSelectOption,
}: {
  data: QuestionData;
  isAnswered: boolean;
  answeredValue: string | null;
  onSelectOption: (val: string) => void;
}) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    onSelectOption(option);
  };

  const handleOtherClick = () => {
    if (isAnswered) return;
    setShowOtherInput((prev) => !prev);
  };

  const handleOtherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherText.trim() || isAnswered) return;
    onSelectOption(otherText.trim());
    setOtherText("");
    setShowOtherInput(false);
  };

  const options = data.options || [];
  const recommendation = data.recommendation || "";
  const isCustomAnswer = answeredValue && !options.includes(answeredValue);

  return (
    <div className="my-3 w-full max-w-md rounded-2xl border border-brand-border bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] text-slate-800">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-black text-brand-primary">
          ?
        </div>
        <div>
          <p className="text-sm font-bold leading-snug text-slate-950">
            {data.question}
          </p>
          {!isAnswered && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Pick the closest answer, or write your own.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = answeredValue === opt;
          const isRecommended =
            recommendation === opt || opt.toLowerCase().includes("recommended");

          return (
            <button
              key={i}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionClick(opt)}
              className={`group w-full rounded-xl border px-3.5 py-3 text-left text-xs font-semibold leading-snug transition-all duration-200 ${
                isSelected
                  ? "border-brand-primary bg-brand-primary text-white shadow-[0_8px_20px_rgba(20,184,166,0.22)]"
                  : isAnswered
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-800 hover:border-brand-primary/60 hover:bg-brand-primary/5 hover:text-slate-950 active:scale-[0.99]"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>{opt}</span>
                {isRecommended && !isAnswered && (
                  <span className="shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand-primary group-hover:bg-white">
                    Best fit
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {/* Other option */}
        <button
          type="button"
          disabled={isAnswered}
          onClick={handleOtherClick}
          className={`w-full rounded-xl border px-3.5 py-3 text-left text-xs font-semibold leading-snug transition-all duration-200 ${
            isCustomAnswer
              ? "border-brand-primary bg-brand-primary text-white shadow-[0_8px_20px_rgba(20,184,166,0.22)]"
              : isAnswered
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : showOtherInput
                  ? "border-brand-primary/60 bg-brand-primary/5 text-slate-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-brand-primary/60 hover:bg-brand-primary/5 hover:text-slate-950 active:scale-[0.99]"
          }`}
        >
          {isCustomAnswer
            ? `Other: "${answeredValue}"`
            : "Other — write a custom answer"}
        </button>

        {/* Custom text input */}
        <AnimatePresence>
          {showOtherInput && !isAnswered && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleOtherSubmit}
              className="overflow-hidden pt-2"
            >
              <div className="flex gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-2">
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Write your custom answer..."
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!otherText.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-all duration-200 hover:bg-brand-primary-dark disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPrompt = searchParams.get("prompt") || "";

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Projects state
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Form Inputs & Chat Input
  const [chatInput, setChatInput] = useState("");
  const [loaderMinimized, setLoaderMinimized] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [tone] = useState("Professional");
  const [colorTheme] = useState("Indigo");
  const [targetAudience] = useState("General Audience");

  // Statuses
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [selectedSkill] = useState<string>("ui-ux-pro-max");

  // Workspace controls
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [iframeWidth, setIframeWidth] = useState<"100%" | "768px" | "375px">(
    "100%",
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Lifted build step status and minimize state timers
  useEffect(() => {
    if (!isGenerating || isInterviewing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuildStep(0);
      return;
    }
    const timers = [
      setTimeout(() => setBuildStep(1), 3500),
      setTimeout(() => setBuildStep(2), 7000),
      setTimeout(() => setBuildStep(3), 10500),
      setTimeout(() => setBuildStep(4), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isGenerating, isInterviewing]);

  // Client-side Authentication Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (!usr) {
        router.push("/login");
      } else {
        setUser(usr);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load projects from local storage / Firestore
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      try {
        const projectsRef = collection(db, "users", user.uid, "projects");
        const q = query(projectsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedProjects: WebProject[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedProjects.push(docSnap.data() as WebProject);
        });

        if (fetchedProjects.length > 0) {
          setProjects(fetchedProjects);
          const storedActiveId = localStorage.getItem(
            `copyai_active_project_${user.uid}`,
          );
          if (
            storedActiveId &&
            fetchedProjects.some((p) => p.id === storedActiveId)
          ) {
            setCurrentProjectId(storedActiveId);
          } else {
            setCurrentProjectId(fetchedProjects[0].id);
          }
          return;
        }
      } catch (firestoreErr) {
        console.warn(
          "Firestore access failed, falling back to localStorage:",
          firestoreErr,
        );
      }

      // Fallback: LocalStorage
      const saved = localStorage.getItem(`copyai_projects_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as WebProject[];
          setProjects(parsed);
          const storedActiveId = localStorage.getItem(
            `copyai_active_project_${user.uid}`,
          );
          if (storedActiveId && parsed.some((p) => p.id === storedActiveId)) {
            setCurrentProjectId(storedActiveId);
          } else if (parsed.length > 0) {
            setCurrentProjectId(parsed[0].id);
          }
        } catch {}
      }
    };

    loadProjects();
  }, [user]);

  // Save projects change to LocalStorage & Firestore
  const syncProjects = async (updatedList: WebProject[]) => {
    if (!user) return;
    setProjects(updatedList);
    localStorage.setItem(
      `copyai_projects_${user.uid}`,
      JSON.stringify(updatedList),
    );
    if (currentProjectId) {
      localStorage.setItem(
        `copyai_active_project_${user.uid}`,
        currentProjectId,
      );
    }
  };

  const saveProjectToFirestore = async (project: WebProject) => {
    if (!user) return;
    try {
      const projectDocRef = doc(db, "users", user.uid, "projects", project.id);
      await setDoc(projectDocRef, project);
    } catch (e) {
      console.error("Failed to sync project to firestore:", e);
    }
  };

  // Handle Initial Prompt from home page Hero
  const hasRunInitialPrompt = useRef(false);
  useEffect(() => {
    if (
      initialPrompt &&
      user &&
      !hasRunInitialPrompt.current &&
      projects.length === 0
    ) {
      hasRunInitialPrompt.current = true;
      // eslint-disable-next-line react-hooks/immutability
      handleSendMessage(undefined, initialPrompt);
      router.replace("/playground");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, user, projects.length]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [projects, currentProjectId, isGenerating]);

  // Listen to message navigation from inside iframe preview
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_NAVIGATE") {
        const targetFile = e.data.fileName;
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === currentProjectId) {
              const files = p.files || [];
              const targetExists = files.some(
                (file) => file.name === targetFile,
              );
              if (!targetExists) return p;

              return {
                ...p,
                activeFileName: targetFile,
                landingPageHtml: compileProjectPreview(files, targetFile),
              };
            }
            return p;
          }),
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentProjectId]);

  const activeProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    const input = chatInputRef.current;
    if (!input) return;

    input.style.height = "auto";
    const nextHeight = Math.min(input.scrollHeight, 120);
    input.style.height = `${Math.max(nextHeight, 48)}px`;
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden";
  }, [chatInput, activeProject]);

  // Copy handler
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [label]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [label]: false }));
    }, 2000);
  };

  // File download utility
  const handleDownloadFile = (
    content: string,
    filename: string,
    contentType: string,
  ) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startNewProject = () => {
    setCurrentProjectId(null);
    setChatInput("");
    setError("");
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;

    const updated = projects.filter((p) => p.id !== id);
    await syncProjects(updated);

    if (currentProjectId === id) {
      setCurrentProjectId(updated.length > 0 ? updated[0].id : null);
    }

    try {
      const projectDocRef = doc(db, "users", user.uid, "projects", id);
      await deleteDoc(projectDocRef);
    } catch {}
  };

  // Unified Handler for prompt generation and chat editing
  const handleSendMessage = async (
    e?: React.FormEvent,
    overridePrompt?: string,
  ) => {
    e?.preventDefault();
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim()) return;

    const existingMessages = activeProject?.messages || [];
    const interviewQuestionCount = countInterviewQuestions(existingMessages);
    const hasGeneratedFiles = Boolean(
      activeProject?.files?.length || activeProject?.landingPageHtml,
    );
    const hasStackChoice = hasImplementationStackChoice(
      existingMessages,
      promptToSend,
    );
    const generationMode =
      !hasGeneratedFiles &&
      !shouldForceBuild(promptToSend) &&
      (interviewQuestionCount < MIN_INTERVIEW_QUESTIONS || !hasStackChoice)
        ? "interview"
        : "build";

    setIsGenerating(true);
    setIsInterviewing(generationMode === "interview");
    setLoaderMinimized(generationMode === "interview");
    setError("");
    if (!overridePrompt) setChatInput("");

    // Generate message IDs
    const userMsgId = `msg-${Date.now()}`;
    const aiMsgId = `msg-${Date.now() + 1}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: promptToSend,
      createdAt: Date.now(),
    };

    let updatedMessages: ChatMessage[] = [];
    let previousHtmlString = "";

    if (activeProject) {
      updatedMessages = [...activeProject.messages, userMessage];
      previousHtmlString = activeProject.landingPageHtml;
    } else {
      updatedMessages = [userMessage];
    }

    // Set an initial placeholder assistant message in the log
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: "assistant",
      text:
        generationMode === "interview"
          ? "Reading your request and preparing the first design question..."
          : "Analyzing request & generating layout...",
      createdAt: Date.now(),
    };

    const tempProjectId = activeProject?.id || `proj-${Date.now()}`;
    const isNewProject = !activeProject;

    if (isNewProject) {
      const newProject: WebProject = {
        id: tempProjectId,
        title:
          promptToSend.slice(0, 30) + (promptToSend.length > 30 ? "..." : ""),
        prompt: promptToSend,
        tone,
        colorTheme,
        targetAudience,
        landingPageHtml: "",
        messages: [...updatedMessages, initialAiMsg],
        createdAt: Date.now(),
      };
      setProjects((prev) => [newProject, ...prev]);
      setCurrentProjectId(tempProjectId);
    } else {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === tempProjectId) {
            return {
              ...p,
              messages: [...updatedMessages, initialAiMsg],
            };
          }
          return p;
        }),
      );
    }

    try {
      const response = await fetch("/api/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          tone,
          colorTheme,
          targetAudience,
          previousHtml: previousHtmlString,
          files:
            activeProject?.files ||
            (previousHtmlString
              ? [
                  {
                    name: "index.html",
                    content: previousHtmlString,
                    language: "html",
                  },
                ]
              : []),
          selectedSkill,
          generationMode,
          chatHistory: updatedMessages.map(({ sender, text }) => ({
            sender,
            text,
          })),
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to contact website builder API.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream received from API.");
      }

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let currentThinking = "";
      let currentFiles: ProjectFile[] = activeProject?.files || [];
      let hasAutoMinimized = false;
      let lastIframeUpdateTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        const parsed = parseStreamingMarkdown(accumulatedText);
        currentThinking =
          generationMode === "interview" ? accumulatedText : parsed.thinking;
        if (parsed.files && parsed.files.length > 0) {
          // eslint-disable-next-line react-hooks/immutability
          currentFiles = parsed.files;
          // Auto-minimize the loader overlay so the user sees live HTML rendering
          if (generationMode === "build" && !hasAutoMinimized) {
            hasAutoMinimized = true;
            setLoaderMinimized(true);
          }
        }

        const streamingAiMsg: ChatMessage = {
          id: aiMsgId,
          sender: "assistant",
          text:
            currentThinking ||
            (generationMode === "interview"
              ? "Preparing the next design question..."
              : "Generating website code..."),
          createdAt: Date.now(),
        };

        const now = Date.now();
        const shouldUpdateIframe = now - lastIframeUpdateTime > 500;
        if (shouldUpdateIframe) {
          lastIframeUpdateTime = now;
        }

        // Update local state in real-time
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === tempProjectId) {
              const activeFile = p.activeFileName || "index.html";
              return {
                ...p,
                files: currentFiles,
                landingPageHtml: shouldUpdateIframe
                  ? compileProjectPreview(currentFiles, activeFile)
                  : p.landingPageHtml,
                messages: [...updatedMessages, streamingAiMsg],
              };
            }
            return p;
          }),
        );
      }

      // Sync final state to DB and localStorage
      const finalAssistantMessage: ChatMessage = {
        id: aiMsgId,
        sender: "assistant",
        text:
          currentThinking ||
          (generationMode === "interview"
            ? accumulatedText || "Interview question ready."
            : "Website generation complete!"),
        createdAt: Date.now(),
      };

      const finalMessages = [...updatedMessages, finalAssistantMessage];
      const finalPreviewHtml = compileProjectPreview(
        currentFiles,
        activeProject?.activeFileName || "index.html",
      );

      if (!isNewProject && activeProject) {
        const refinedProject: WebProject = {
          ...activeProject,
          files: currentFiles,
          landingPageHtml: finalPreviewHtml,
          messages: finalMessages,
        };
        const updatedList = projects.map((p) =>
          p.id === refinedProject.id ? refinedProject : p,
        );
        await syncProjects(updatedList);
        await saveProjectToFirestore(refinedProject);
      } else {
        const newProject: WebProject = {
          id: tempProjectId,
          title:
            promptToSend.slice(0, 30) + (promptToSend.length > 30 ? "..." : ""),
          prompt: promptToSend,
          tone,
          colorTheme,
          targetAudience,
          files: currentFiles,
          landingPageHtml: finalPreviewHtml,
          activeFileName: "index.html",
          messages: finalMessages,
          createdAt: Date.now(),
        };
        setProjects((prev) => {
          const filtered = prev.filter((p) => p.id !== tempProjectId);
          const updatedList = [newProject, ...filtered];
          syncProjects(updatedList);
          saveProjectToFirestore(newProject);
          return updatedList;
        });
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while generating code.";
      setError(errMsg);

      const errorAiMsg: ChatMessage = {
        id: aiMsgId,
        sender: "assistant",
        text: `Error: ${errMsg}`,
        createdAt: Date.now(),
      };

      setProjects((prev) => {
        const updatedList = prev.map((p) => {
          if (p.id === tempProjectId) {
            return {
              ...p,
              messages: [...updatedMessages, errorAiMsg],
            };
          }
          return p;
        });
        syncProjects(updatedList);
        return updatedList;
      });
    } finally {
      setIsGenerating(false);
      setIsInterviewing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex h-dvh overflow-hidden font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Projects history */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${sidebarCollapsed ? "md:w-14" : "md:w-72"} fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-brand-border transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}
      >
        {sidebarCollapsed ? (
          <div className="flex-1 flex flex-col items-center py-4 bg-white shrink-0">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-xl border border-brand-border hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-3xs"
              title="Expand Sidebar"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white shrink-0 h-16">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold text-sm">Return Home</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-500 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 shrink-0">
              <Button
                onClick={startNewProject}
                variant="outline"
                className="w-full justify-start gap-2 border-brand-border bg-white hover:bg-brand-primary/5 text-brand-primary h-12 rounded-xl transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                New Landing Page
              </Button>
            </div>

            {/* Saved projects list */}
            <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 scrollbar-thin">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`group relative rounded-xl border transition-all duration-200 flex items-center ${
                    currentProjectId === p.id
                      ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary shadow-xs"
                      : "bg-white border-transparent hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className="flex-1 py-3.5 pl-4 pr-10 flex items-center gap-3 text-left overflow-hidden"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-80" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-semibold">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, p.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity absolute right-2 text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center text-sm text-gray-400 mt-12 px-4 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
                  Your custom websites catalog will appear here.
                </div>
              )}
            </div>

            {/* Collapse button above profile */}
            <div className="hidden md:flex px-4 py-2 justify-start bg-white shrink-0">
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-2 rounded-xl border border-brand-border hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-3xs"
                title="Collapse Sidebar"
              >
                <PanelRightClose className="w-5 h-5" />
              </button>
            </div>

            {/* User profile / Logout */}
            <div className="p-4 border-t border-brand-border bg-white shrink-0">
              <div className="flex items-center gap-3 mb-3 px-1">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User Profile"}
                    width={32}
                    height={32}
                    unoptimized
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-brand-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0">
                    {(user?.displayName || user?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {user?.displayName || user?.email}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Builder Workspace
                  </span>
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    router.push("/");
                  } catch {}
                }}
                variant="outline"
                className="w-full justify-center gap-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 h-10 rounded-xl text-xs font-semibold transition-colors"
              >
                Sign Out
              </Button>
            </div>
          </>
        )}
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-gray-50/50 relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-16 border-b border-brand-border flex items-center justify-between px-4 bg-white shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Pomelli<span className="text-brand-primary">AI</span>
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
            Builder Workspace
          </span>
        </header>

        {/* Dual Pane Layout Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* LEFT PANE: Chat & Generation Inputs */}
          <div className="w-full lg:w-[480px] border-r border-brand-border bg-white flex flex-col h-full shrink-0">
            {/* Top Toolbar / Configuration */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between shrink-0 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  {activeProject ? "Refining Site Layout" : "Create New Site"}
                </span>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-50/30">
              {activeProject ? (
                <>
                  {activeProject.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`text-[10px] text-gray-400 mb-1 px-1 font-semibold`}
                      >
                        {msg.sender === "user" ? "You" : "Builder AI"}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-brand-primary text-white shadow-sm rounded-tr-none"
                            : "bg-white border border-brand-border text-gray-800 shadow-3xs rounded-tl-none"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          msg.text
                        ) : (
                          <ReactMarkdown
                            components={{
                              h1: ({ ...props }) => (
                                <h1
                                  className="text-base font-extrabold mt-3 mb-1 text-gray-900"
                                  {...props}
                                />
                              ),
                              h2: ({ ...props }) => (
                                <h2
                                  className="text-sm font-extrabold mt-3 mb-1 text-gray-900"
                                  {...props}
                                />
                              ),
                              h3: ({ ...props }) => (
                                <h3
                                  className="text-xs font-bold mt-2 mb-1 text-gray-900"
                                  {...props}
                                />
                              ),
                              p: ({ ...props }) => (
                                <p
                                  className="mb-2 last:mb-0 text-gray-700 leading-relaxed"
                                  {...props}
                                />
                              ),
                              ul: ({ ...props }) => (
                                <ul
                                  className="list-disc pl-4 mb-2 space-y-0.5 text-gray-700"
                                  {...props}
                                />
                              ),
                              ol: ({ ...props }) => (
                                <ol
                                  className="list-decimal pl-4 mb-2 space-y-0.5 text-gray-700"
                                  {...props}
                                />
                              ),
                              li: ({ ...props }) => (
                                <li className="text-gray-700" {...props} />
                              ),
                              strong: ({ ...props }) => (
                                <strong
                                  className="font-extrabold text-gray-950"
                                  {...props}
                                />
                              ),
                              pre: ({
                                children,
                                ...props
                              }: React.HTMLAttributes<HTMLPreElement>) => {
                                const isQuestion = React.Children.toArray(
                                  children,
                                ).some((child) => {
                                  return (
                                    React.isValidElement<{
                                      className?: string;
                                    }>(child) &&
                                    child.props.className &&
                                    child.props.className.includes(
                                      "language-question",
                                    )
                                  );
                                });
                                if (isQuestion) {
                                  return <>{children}</>;
                                }
                                return (
                                  <pre
                                    className="bg-slate-900 text-white rounded-lg p-4 my-2 overflow-x-auto"
                                    {...props}
                                  >
                                    {children}
                                  </pre>
                                );
                              },
                              code: ({
                                className,
                                children,
                                ...props
                              }: React.HTMLAttributes<HTMLElement>) => {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                const isQuestion =
                                  match && match[1] === "question";

                                if (isQuestion) {
                                  const data = parseQuestionData(
                                    String(children),
                                  );

                                  if (data) {
                                    const msgIndex =
                                      activeProject.messages.findIndex(
                                        (m) => m.id === msg.id,
                                      );
                                    const nextMsg =
                                      activeProject.messages[msgIndex + 1];
                                    const answeredValue =
                                      nextMsg && nextMsg.sender === "user"
                                        ? nextMsg.text
                                        : null;
                                    const isAnswered = answeredValue !== null;

                                    return (
                                      <InteractiveQuestionCard
                                        data={data}
                                        isAnswered={isAnswered}
                                        answeredValue={answeredValue}
                                        onSelectOption={(val) => {
                                          handleSendMessage(undefined, val);
                                        }}
                                      />
                                    );
                                  }

                                  return null;
                                }
                                return (
                                  <code
                                    className="bg-gray-100 rounded px-1.5 py-0.5 font-mono text-[11px] text-indigo-600 font-semibold"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex flex-col items-start">
                      <div className="text-[10px] text-gray-400 mb-1 px-1 font-semibold flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />
                        {isInterviewing
                          ? "AI Builder is interviewing..."
                          : "AI Builder is designing..."}
                      </div>
                      <div className="bg-white border border-brand-border rounded-2xl rounded-tl-none p-4 shadow-3xs space-y-3 w-[85%]">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-150 rounded w-5/6 animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 text-brand-primary relative">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">
                    Welcome to Web Playground
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    Describe your landing page idea. Builder AI will interview
                    you first, then use the UI/UX skill guide to create the
                    site.
                  </p>
                </div>
              )}
            </div>

            {/* Error Indicator */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border-t border-b border-red-100 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <p className="leading-snug">{error}</p>
              </div>
            )}

            {/* Chat Input form */}
            <div className="p-4 border-t border-brand-border bg-white shrink-0">
              <form
                onSubmit={handleSendMessage}
                className="relative flex items-center"
              >
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    activeProject
                      ? "Ask to modify design, add features, change copy..."
                      : "Describe your landing page idea — I’ll ask a few design questions first..."
                  }
                  className="w-full min-h-[48px] max-h-[120px] pr-12 pl-4 py-3 border border-brand-border rounded-2xl bg-gray-50/50 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none overflow-hidden text-gray-800 placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isGenerating}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="absolute right-3 p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-colors disabled:opacity-40 disabled:hover:bg-brand-primary"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT PANE: Code & Website Live Preview Viewport */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100/50">
            {/* Top Preview Toolbar */}
            <div className="p-3.5 border-b border-brand-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              {/* Responsive Width toggles */}
              <div className="flex items-center gap-4">
                <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                  <ViewportButton
                    active={iframeWidth === "100%"}
                    onClick={() => setIframeWidth("100%")}
                    icon={<Monitor className="w-4 h-4" />}
                    title="Desktop width"
                  />
                  <ViewportButton
                    active={iframeWidth === "768px"}
                    onClick={() => setIframeWidth("768px")}
                    icon={<Tablet className="w-4 h-4" />}
                    title="Tablet width"
                  />
                  <ViewportButton
                    active={iframeWidth === "375px"}
                    onClick={() => setIframeWidth("375px")}
                    icon={<Smartphone className="w-4 h-4" />}
                    title="Mobile width"
                  />
                </div>

                {activeProject && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                    Viewport:{" "}
                    {iframeWidth === "100%"
                      ? "Desktop"
                      : iframeWidth === "768px"
                        ? "Tablet"
                        : "Mobile"}
                  </span>
                )}
              </div>

              {/* Mode switch (Live Preview / Code view) */}
              <div className="flex items-center gap-3">
                <div className="flex border border-brand-border rounded-xl p-0.5 bg-gray-50">
                  <TabButton
                    active={activeTab === "preview"}
                    onClick={() => setActiveTab("preview")}
                    icon={<Eye className="w-3.5 h-3.5" />}
                    label="Live Preview"
                  />
                  <TabButton
                    active={activeTab === "code"}
                    onClick={() => setActiveTab("code")}
                    icon={<Code className="w-3.5 h-3.5" />}
                    label="Code View"
                  />
                </div>

                {activeProject && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyText(activeProject.landingPageHtml, "html")
                      }
                      className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                    >
                      {copiedStates["html"] ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDownloadFile(
                          activeProject.landingPageHtml,
                          "index.html",
                          "text/html",
                        )
                      }
                      className="rounded-lg h-9 border-brand-border text-xs font-semibold text-gray-600 bg-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Project Files Selector Bar */}
            {activeProject &&
              activeProject.files &&
              activeProject.files.length > 0 && (
                <div className="bg-gray-50 border-b border-brand-border px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 shrink-0">
                    Files:
                  </span>
                  {activeProject.files.map((file) => {
                    const isActive =
                      (activeProject.activeFileName || "index.html") ===
                      file.name;
                    const isHtml = file.name.endsWith(".html");
                    const isCss = file.name.endsWith(".css");
                    const isJs =
                      file.name.endsWith(".js") ||
                      file.name.endsWith(".javascript");
                    const isJson = file.name.endsWith(".json");

                    return (
                      <button
                        key={file.name}
                        onClick={() => {
                          setProjects((prev) =>
                            prev.map((p) => {
                              if (p.id === activeProject.id) {
                                return {
                                  ...p,
                                  activeFileName: file.name,
                                  landingPageHtml: compileProjectPreview(
                                    p.files || [],
                                    file.name,
                                  ),
                                };
                              }
                              return p;
                            }),
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                          isActive
                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary font-bold shadow-3xs"
                            : "bg-white border-brand-border text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {isHtml ? (
                          <HtmlIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : isCss ? (
                          <CssIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : isJs ? (
                          <JsIcon className="w-3.5 h-3.5 rounded-xs shrink-0" />
                        ) : isJson ? (
                          <FileJson className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        {file.name}
                      </button>
                    );
                  })}
                </div>
              )}

            {/* Sandbox Canvas */}
            <div className="flex-1 p-4 lg:p-6 flex justify-center items-center overflow-hidden relative w-full h-full">
              {/* Active Build Loader Overlay */}
              <AnimatePresence>
                {isGenerating && !isInterviewing && !loaderMinimized && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn"
                  >
                    <div className="max-w-md w-full space-y-6">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-primary/10 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-brand-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                          <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-gray-950">
                          AI Builder is constructing your site
                        </h3>
                        <p className="text-xs text-gray-500">
                          Writing code structure, content blocks, Tailwind
                          variables, and layout sections...
                        </p>
                      </div>

                      {/* Build Progress list */}
                      <BuildProgressIndicator step={buildStep} />

                      {/* Animated linear progress bar */}
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                        <motion.div
                          className="h-full bg-linear-to-r from-brand-primary to-indigo-600"
                          animate={{ width: ["0%", "98%"] }}
                          transition={{ duration: 16, ease: "easeOut" }}
                        />
                      </div>

                      {/* Peeking minimize option */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setLoaderMinimized(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-border bg-white hover:bg-gray-55 text-gray-600 rounded-xl text-xs font-semibold shadow-3xs transition-all hover:scale-102"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Live Preview While Building
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Loader Status Bar (Visible when loader is minimized during generation) */}
              {isGenerating && !isInterviewing && loaderMinimized && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-md shadow-md border border-slate-800 px-4 py-2.5 rounded-full z-20 flex items-center gap-3 text-xs transition-all">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary shrink-0" />
                  <span className="font-semibold text-slate-300">
                    AI: {BUILD_STEPS[buildStep]}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <button
                    type="button"
                    onClick={() => setLoaderMinimized(false)}
                    className="text-brand-primary hover:text-brand-primary-light font-bold flex items-center gap-1 bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide transition-colors"
                  >
                    Maximize Status
                  </button>
                </div>
              )}

              {activeProject ? (
                activeTab === "preview" ? (
                  <div
                    className="h-full bg-white rounded-2xl border border-gray-250/80 overflow-hidden shadow-sm transition-all duration-300 relative flex flex-col"
                    style={{ width: iframeWidth }}
                  >
                    {/* Mock Browser Header */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200/80 flex items-center text-[10px] font-mono text-gray-400 gap-2 shrink-0">
                      <div className="flex gap-1.5 mr-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <span className="truncate">
                        https://yourproject.live/preview
                      </span>
                    </div>

                    <iframe
                      srcDoc={
                        activeProject.files?.length
                          ? compileProjectPreview(
                              activeProject.files,
                              activeProject.activeFileName || "index.html",
                            )
                          : compileProjectPreview(
                              [
                                {
                                  name: "index.html",
                                  language: "html",
                                  content: activeProject.landingPageHtml,
                                },
                              ],
                              "index.html",
                            )
                      }
                      title="Landing page preview sandbox"
                      className="flex-1 w-full border-none bg-white"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  /* Code view split container */
                  <div
                    className="h-full bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden shadow-lg flex flex-row transition-all duration-300"
                    style={{ width: iframeWidth }}
                  >
                    {/* File Explorer Sidebar */}
                    <div className="w-52 bg-slate-950 border-r border-slate-850 flex flex-col shrink-0 select-none">
                      <div className="px-4 py-3 border-b border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-slate-900/50">
                        <Monitor className="w-3.5 h-3.5 text-brand-primary" />
                        WORKSPACE FILES
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-none">
                        {(activeProject.files && activeProject.files.length > 0
                          ? activeProject.files
                          : [
                              {
                                name: "index.html",
                                content: activeProject.landingPageHtml,
                                language: "html" as const,
                              },
                            ]
                        ).map((file) => {
                          const isActive =
                            (activeProject.activeFileName || "index.html") ===
                            file.name;

                          return (
                            <FileTabButton
                              key={file.name}
                              fileName={file.name}
                              active={isActive}
                              variant="dark"
                              onClick={() => {
                                setProjects((prev) =>
                                  prev.map((p) => {
                                    if (p.id === activeProject.id) {
                                      return {
                                        ...p,
                                        activeFileName: file.name,
                                        landingPageHtml: compileProjectPreview(
                                          p.files || [],
                                          file.name,
                                        ),
                                      };
                                    }
                                    return p;
                                  }),
                                );
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Code editor container */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="bg-slate-955 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center border-b border-slate-900 shrink-0">
                        <span>
                          {activeProject.activeFileName || "index.html"}
                        </span>
                        <span className="ml-auto text-brand-primary font-bold uppercase tracking-wider">
                          {(activeProject.files &&
                            activeProject.files.find(
                              (f) =>
                                f.name ===
                                (activeProject.activeFileName || "index.html"),
                            )?.language) ||
                            "html"}
                        </span>
                      </div>
                      <CodeHighlighter
                        code={
                          (activeProject.files &&
                            activeProject.files.find(
                              (f) =>
                                f.name ===
                                (activeProject.activeFileName || "index.html"),
                            )?.content) ||
                          activeProject.landingPageHtml
                        }
                        language={
                          (activeProject.files &&
                            activeProject.files.find(
                              (f) =>
                                f.name ===
                                (activeProject.activeFileName || "index.html"),
                            )?.language) ||
                          "html"
                        }
                        onChange={(newContent) => {
                          const activeFile =
                            activeProject.activeFileName || "index.html";
                          setProjects((prev) =>
                            prev.map((p) => {
                              if (p.id === activeProject.id) {
                                const updatedFiles = p.files
                                  ? p.files.map((f) => {
                                      if (f.name === activeFile) {
                                        return { ...f, content: newContent };
                                      }
                                      return f;
                                    })
                                  : [
                                      {
                                        name: "index.html",
                                        content: newContent,
                                        language: "html" as const,
                                      },
                                    ];

                                return {
                                  ...p,
                                  files: updatedFiles,
                                  landingPageHtml: compileProjectPreview(
                                    updatedFiles,
                                    activeFile,
                                  ),
                                };
                              }
                              return p;
                            }),
                          );
                        }}
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <div className="w-16 h-16 bg-white border border-brand-border rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-3xs text-gray-300">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 mb-1">
                    Web Preview Canvas
                  </h3>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Once you submit a layout description, a live responsive
                    preview frame will be compiled and displayed here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
