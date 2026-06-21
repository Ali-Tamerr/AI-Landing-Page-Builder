import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const skillsDir = path.join(process.cwd(), "skills");
    if (!fs.existsSync(skillsDir)) {
      return NextResponse.json({ skills: [] });
    }

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skills: { name: string; label: string }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Directory-based skill (e.g. ui-ux-pro-max with scripts/search.py)
        const scriptPath = path.join(skillsDir, entry.name, "scripts", "search.py");
        if (fs.existsSync(scriptPath)) {
          skills.push({
            name: entry.name, // identifier without .md
            label: entry.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          });
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        // Plain markdown skill file
        skills.push({
          name: entry.name,
          label: entry.name.replace(/-/g, " ").replace(".md", "").replace(/\b\w/g, c => c.toUpperCase()),
        });
      }
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to list skills" }, { status: 500 });
  }
}
