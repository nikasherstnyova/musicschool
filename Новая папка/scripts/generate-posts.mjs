import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const OUT_FILE = path.join(POSTS_DIR, "index.json");

function parseFrontmatter(md) {
  // дуже простий парсер YAML frontmatter між --- ---
  const m = md.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!m) return { data: {}, body: md };

  const raw = m[1];
  const body = m[2].trim();

  const data = {};
  raw.split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (key) data[key] = val;
  });

  return { data, body };
}

function excerptFrom(body, maxLen = 160) {
  const text = body
    .replace(/!\[.*?\]\(.*?\)/g, "")   // прибрати картинки markdown
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // прибрати лінки markdown
    .replace(/[#>*`_~-]/g, "")        // прибрати службові символи
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));

const posts = files.map(file => {
  const full = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, body } = parseFrontmatter(full);

  return {
    title: data.title || "Без назви",
    date: data.date || "",
    type: data.type || "news",
    cover: data.cover || "",
    video: data.video || "",
    excerpt: excerptFrom(body),
    slug: file.replace(/\.md$/, "")
  };
});

// Нові зверху
posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2), "utf8");
console.log(`Generated ${OUT_FILE} with ${posts.length} posts.`);
    