import fs from "fs";
import path from "path";

const folder = path.join(process.cwd(), "content", "teachers");
const outFile = path.join(folder, "index.json");

function parseFrontmatter(md) {
  const match = md.match(/^---\s*([\s\S]*?)\s*---\s*/);
  if (!match) return { data: {}, body: md };
  const fm = match[1];
  const body = md.slice(match[0].length);

  const data = {};
  fm.split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    data[key] = val.replace(/^"(.*)"$/, "$1");
  });

  return { data, body: body.trim() };
}

const files = fs.readdirSync(folder).filter(f => f.endsWith(".md"));

const items = files.map(file => {
  const full = fs.readFileSync(path.join(folder, file), "utf8");
  const { data, body } = parseFrontmatter(full);

  return {
    slug: file.replace(/\.md$/, ""),
    department: data.department || "Без відділу",
    name: data.name || "Без імені",
    role: data.role || "",
    photo: data.photo || "",
    bio: data.bio || body || ""
  };
});

// ✅ Сортування (ставиться ОТУТ, після items.map)
items.sort((a, b) =>
  a.department.localeCompare(b.department, "uk") ||
  a.name.localeCompare(b.name, "uk")
);

fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf8");
console.log(`Generated ${outFile} with ${items.length} teachers.`);
