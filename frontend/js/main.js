const state = { qv: {} };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Build an element and set its text safely (never innerHTML for database data)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Lets long names like "My_Long_Repo_Name" wrap at _ and - instead of overflowing the card
const breakable = (text) => String(text ?? "").replace(/([_-])/g, "$1\u200b");

// Only allow http(s) links, so a value like "javascript:..." can never become a link
function safeUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function linkEl(label, url) {
  const href = safeUrl(url);
  if (!href) return null;
  const a = el("a", "", label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

/* ---------- Scroll reveal ---------- */
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      )
    : null;

function reveal(node) {
  if (!revealObserver || reduceMotion) return;
  node.classList.add("reveal");
  node.addEventListener("transitionend", () => node.classList.remove("reveal", "in"), { once: true });
  revealObserver.observe(node);
}

/* ---------- Renderers ---------- */
function renderRepo(r) {
  const card = el("article", "card");
  const meta = el("div", "card-meta");
  meta.append(el("span", "", r.language ?? "—"), el("span", "", `★ ${r.stars}`));
  card.append(meta, el("h3", "", breakable(r.name)));
  card.append(el("p", "", r.description ?? "No description yet."));

  if (r.topics.length) {
    const tags = el("ul", "tags");
    r.topics.forEach((t) => tags.append(el("li", "", t)));
    card.append(tags);
  }
  const link = linkEl("View on GitHub", r.url);
  if (link) {
    const links = el("div", "links");
    links.append(link);
    card.append(links);
  }
  return card;
}

function renderCertificate(c) {
  const card = el("article", "card");
  const meta = el("div", "card-meta");
  meta.append(el("span", "", c.issuer), el("span", "", c.issued_date ?? ""));
  card.append(meta, el("h3", "", breakable(c.title)));

  if (c.credential_id) card.append(el("p", "", `ID: ${c.credential_id}`));

  const links = el("div", "links");
  [
    c.has_file ? linkEl("View certificate (PDF)", `${API_BASE}/certificates/${c.id}/file`) : null,
    linkEl("Verify credential", c.credential_url),
  ]
    .filter(Boolean)
    .forEach((a) => links.append(a));
  if (links.children.length) card.append(links);
  return card;
}

function renderExperience(x) {
  const item = el("li", "timeline-item");
  item.append(el("p", "timeline-period mono", x.period), el("h3", "", x.role), el("p", "timeline-company", x.company));
  if (x.highlights?.length) {
    const ul = el("ul", "bullets");
    x.highlights.forEach((h) => ul.append(el("li", "", h)));
    item.append(ul);
  }
  return item;
}

function renderEducation(x) {
  const item = el("li", "timeline-item");
  item.append(el("p", "timeline-period mono", x.period), el("h3", "", x.degree), el("p", "timeline-company", x.institution));
  return item;
}

function renderSkills(groups) {
  const root = document.getElementById("skills");
  root.replaceChildren(
    ...groups
      .filter((g) => g.items?.length)
      .map((g) => {
        const box = el("div", "skill-group");
        const tags = el("ul", "tags");
        g.items.forEach((t) => tags.append(el("li", "", t)));
        box.append(el("h3", "mono", g.label), tags);
        return box;
      })
  );
}

function skillGroups(groups) {
  const learning = PROFILE.learning ?? [];
  return learning.length ? [...groups, { label: "Currently learning", items: learning }] : groups;
}

/* ---------- Recruiter quick view (from the admin page) ---------- */
function renderStatus() {
  const dl = document.getElementById("status");
  if (!dl) return; // safe if you delete the element from index.html
  const qv = state.qv ?? {};

  const items = [
    ["Open to", qv.open_to || PROFILE.openTo, true],
    ["Availability", qv.availability],
    ["Work", qv.work_preference],
    ["Location", qv.location || PROFILE.city],
  ].filter(([, value]) => value);

  dl.replaceChildren(
    ...items.map(([label, value, live]) => {
      const row = el("div", "status-item");
      const dd = el("dd");
      if (live) dd.append(el("span", "dot"));
      dd.append(document.createTextNode(value));
      row.append(el("dt", "", label), dd);
      return row;
    })
  );
  dl.hidden = !items.length;
}

/* ---------- Loaders ---------- */
async function load(path, gridId, renderer, { featuredFirst = false } = {}) {
  const grid = document.getElementById(gridId);
  const waking = setTimeout(() => {
    grid.replaceChildren(el("p", "empty", "Waking up the server (free hosting), this can take up to a minute…"));
  }, 3000);

  try {
    let items = await fetchJSON(path);
    clearTimeout(waking);
    grid.replaceChildren();
    if (!items.length) {
      grid.append(el("p", "empty", "Nothing here yet."));
      return;
    }
    if (featuredFirst) {
      items = [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    items.forEach((item, i) => {
      const node = renderer(item, i);
      grid.append(node);
      reveal(node);
    });
  } catch (err) {
    clearTimeout(waking);
    grid.replaceChildren(el("p", "empty", "Could not load this section right now."));
    console.error(err);
  }
}

async function loadProfile() {
  renderSkills(skillGroups(PROFILE.skills ?? []));
  try {
    const p = await fetchJSON("/profile/");

    document.querySelectorAll("[data-resume-link]").forEach((a) => {
      a.href = `${API_BASE}/resume/download`;
      a.hidden = !p.has_resume_file;
    });

    state.qv = p.quick_view ?? {};
    renderStatus();

    if (p.resume) {
      const { skills, experience, education } = p.resume;
      if (skills?.length) renderSkills(skillGroups(skills));

      if (experience?.length || education?.length) {
        document.getElementById("experience").hidden = false;
        const navExp = document.getElementById("nav-experience");
        if (navExp) navExp.hidden = false;

        const expList = document.getElementById("experience-list");
        expList.hidden = !experience?.length;
        (experience ?? []).forEach((x) => {
          const node = renderExperience(x);
          expList.append(node);
          reveal(node);
        });

        document.getElementById("education-block").hidden = !education?.length;
        const eduList = document.getElementById("education-list");
        (education ?? []).forEach((x) => {
          const node = renderEducation(x);
          eduList.append(node);
          reveal(node);
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Personal details (from config.js) ---------- */
function applyProfile() {
  const facts = [
    ["Based in", PROFILE.city],
    ["Education", PROFILE.education],
    ["Currently", PROFILE.current],
  ].filter(([, value]) => value);

  const list = document.getElementById("facts");
  facts.forEach(([label, value]) => {
    const li = el("li");
    li.append(el("span", "mono", label), el("span", "", value));
    list.append(li);
  });

  if (PROFILE.email) {
    const mailto = `mailto:${PROFILE.email}`;

    const heroEmail = document.getElementById("hero-email");
    heroEmail.href = mailto;
    heroEmail.hidden = false;

    const link = document.getElementById("email-link");
    link.href = mailto;
    link.textContent = PROFILE.email;
    document.getElementById("email-line").hidden = false;

    document.getElementById("copy-email").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      try {
        await navigator.clipboard.writeText(PROFILE.email);
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Select the address and press Ctrl+C";
      }
      setTimeout(() => (btn.textContent = "Copy email"), 2500);
    });
  }
}

/* ---------- Theme ---------- */
function setupTheme() {
  const btn = document.getElementById("theme-toggle");
  const apply = (theme, save) => {
    document.documentElement.dataset.theme = theme;
    btn.textContent = theme === "dark" ? "☀" : "☾";
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (save) {
      try { localStorage.setItem("theme", theme); } catch {}
    }
  };
  apply(document.documentElement.dataset.theme || "dark", false);
  btn.addEventListener("click", () => {
    apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });
}

/* ---------- Start ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
setupTheme();
applyProfile();
renderStatus();
document.querySelectorAll(".section-head, .about").forEach(reveal);

load("/github/repos", "repos-grid", renderRepo);
load("/certificates/", "certificates-grid", renderCertificate);
loadProfile();
