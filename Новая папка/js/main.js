// ===============================
// 1) Active nav highlight
// ===============================
(function setActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
})();


// ===============================
// 2) Theme toggle (dark/light)
// ===============================
(function themeInit() {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const icon = btn?.querySelector(".theme-icon");

  const saved = localStorage.getItem("theme");
  const systemPrefersLight =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

  let theme = saved || (systemPrefersLight ? "light" : "dark");
  applyTheme(theme);

  btn?.addEventListener("click", () => {
    theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  });

  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (icon) icon.textContent = t === "light" ? "☀️" : "🌙";
  }
})();


// ===============================
// 3) Smooth scroll to department (courses page buttons)
// Requires: .dept-card[data-target="id"], and section id="..."
// ===============================
(function deptScrollInit() {
  const buttons = document.querySelectorAll(".dept-card");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;

      const el = document.getElementById(targetId);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // optional: visual active state on clicked button
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
})();


// ===============================
// 4) Teachers page render by departments
// Requires in teachers.html:
//  - section titles already in HTML
//  - grids with ids:
//      teachersGrid-orchestra
//      teachersGrid-piano
//      teachersGrid-theory
//      teachersGrid-art
//      teachersGrid-dance
//  - hints with ids:
//      teachersHint-orchestra, etc.
// Data: content/teachers/index.json
// Each teacher object should have:
//  { name, role, photo, department }
// ===============================
(async function renderTeachersByDepartments() {
  const grids = {
    "Оркестровий відділ": document.getElementById("teachersGrid-orchestra"),
    "Фортепіанний відділ": document.getElementById("teachersGrid-piano"),
    "Теоретично-хоровий відділ та клас сольного співу": document.getElementById("teachersGrid-theory"),
    "Художній відділ": document.getElementById("teachersGrid-art"),
    "Хореографічний відділ": document.getElementById("teachersGrid-dance"),
  };

  const hints = {
    "Оркестровий відділ": document.getElementById("teachersHint-orchestra"),
    "Фортепіанний відділ": document.getElementById("teachersHint-piano"),
    "Теоретично-хоровий відділ та клас сольного співу": document.getElementById("teachersHint-theory"),
    "Художній відділ": document.getElementById("teachersHint-art"),
    "Хореографічний відділ": document.getElementById("teachersHint-dance"),
  };

  const isTeachersPage = Object.values(grids).some(Boolean);
  if (!isTeachersPage) return;

  // clean
  Object.values(grids).forEach((g) => g && (g.innerHTML = ""));
  Object.values(hints).forEach((h) => h && (h.style.display = "none"));

  try {
    const res = await fetch("content/teachers/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("teachers index.json not found");
    const teachers = await res.json();

    // group by department
    const groups = {};
    for (const t of teachers) {
      const dept = (t.department || "").trim() || "Оркестровий відділ";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(t);
    }

    // sort inside each department
    for (const dept of Object.keys(groups)) {
      groups[dept].sort((a, b) => (a.name || "").localeCompare(b.name || "", "uk"));
    }

    // render each department into its grid
    for (const dept of Object.keys(grids)) {
      const grid = grids[dept];
      const hint = hints[dept];
      if (!grid) continue;

      const list = groups[dept] || [];

      if (list.length === 0) {
        if (hint) {
          hint.style.display = "block";
          hint.textContent = "Поки немає викладачів у цьому відділі.";
        }
        continue;
      }

      grid.innerHTML = list
        .map(
          (t) => `
          <article class="card teacher-card">
            <div class="teacher-photo">
              ${
                t.photo
                  ? `<img src="${t.photo}" alt="${escapeHtml(t.name || "")}">`
                  : ``
              }
            </div>
            <div class="teacher-info">
              <h3 class="teacher-name">${escapeHtml(t.name || "")}</h3>
              ${t.role ? `<p class="teacher-meta muted">${escapeHtml(t.role)}</p>` : ``}
            </div>
          </article>
        `
        )
        .join("");
    }
  } catch (e) {
    const firstHint = Object.values(hints).find(Boolean);
    if (firstHint) {
      firstHint.style.display = "block";
      firstHint.textContent =
        "Не вдалося завантажити викладачів (перевір шлях до content/teachers/index.json та що build зроблений).";
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();


// ===============================
// 5) News page render (optional)
// Requires in news.html:
//   <div id="postsGrid" class="posts-grid"></div>
//   <p id="postsHint" class="small muted" style="display:none;"></p>
// Data: content/posts/index.json
// Each post could have: title, date, type, cover, video, excerpt/text
// ===============================
(async function renderPosts() {
  const grid = document.getElementById("postsGrid");
  const hint = document.getElementById("postsHint");
  if (!grid) return;

  try {
    const res = await fetch("content/posts/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("posts index.json not found");
    const posts = await res.json();

    if (!posts.length) {
      if (hint) {
        hint.style.display = "block";
        hint.textContent = "Поки немає новин.";
      }
      return;
    }

    grid.innerHTML = posts
      .map((p) => {
        const typeLabel = p.type === "event" ? "Подія" : "Новина";
        const date = p.date ? escapeHtml(p.date) : "";
        const title = escapeHtml(p.title || "");
        const text = escapeHtml(p.excerpt || p.text || "");
        const cover = p.cover ? `<img src="${p.cover}" alt="${title}">` : "";

        const videoBtn = p.video
          ? `<a class="btn" href="${p.video}" target="_blank" rel="noopener">Відео</a>`
          : "";

        return `
          <article class="card post-card">
            <div class="post-cover">${cover}</div>
            <div class="post-meta">
              <span class="badge">${typeLabel}</span>
              ${date ? `<span>${date}</span>` : ``}
            </div>
            <h3 class="post-title">${title}</h3>
            ${text ? `<p class="post-text">${text}</p>` : ``}
            ${videoBtn ? `<div class="actions">${videoBtn}</div>` : ``}
          </article>
        `;
      })
      .join("");
  } catch (e) {
    if (hint) {
      hint.style.display = "block";
      hint.textContent =
        "Не вдалося завантажити новини (перевір шлях до content/posts/index.json).";
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
