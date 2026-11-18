const API_BASE = "http://127.0.0.1:8000/api";

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

// Only allow http(s) links, so a bad value like "javascript:..." can never become a clickable link
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

function renderProject(p, i) {
  const card = el("article", "card");

  const imgSrc = safeUrl(p.image_url);
  if (imgSrc) {
    const img = el("img", "card-image");
    img.src = imgSrc;
    img.alt = `${p.title} preview`;
    img.loading = "lazy";
    card.append(img);
  }

  const meta = el("div", "card-meta");
  meta.append(el("span", "", String(i + 1).padStart(2, "0")));
  if (p.featured) meta.append(el("span", "badge", "Featured"));
  card.append(meta);

  card.append(el("h3", "", p.title), el("p", "", p.description));

  const tags = el("ul", "tags");
  p.tech_stack.forEach((t) => tags.append(el("li", "", t)));
  card.append(tags);

  const links = el("div", "links");
  [linkEl("GitHub", p.github_url), linkEl("Live demo", p.live_url)]
    .filter(Boolean)
    .forEach((a) => links.append(a));
  if (links.children.length) card.append(links);

  return card;
}

function renderCertificate(c) {
  const card = el("article", "card");

  const meta = el("div", "card-meta");
  meta.append(el("span", "", c.issuer), el("span", "", c.issued_date ?? ""));
  card.append(meta, el("h3", "", c.title));

  if (c.credential_id) card.append(el("p", "", `ID: ${c.credential_id}`));

  const verify = linkEl("Verify credential", c.credential_url);
  if (verify) {
    const links = el("div", "links");
    links.append(verify);
    card.append(links);
  }
  return card;
}

async function load(path, gridId, renderer, { featuredFirst = false } = {}) {
  const grid = document.getElementById(gridId);
  try {
    let items = await fetchJSON(path);
    if (!items.length) {
      grid.append(el("p", "empty", "Nothing here yet."));
      return;
    }
    if (featuredFirst) {
      items = [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    items.forEach((item, i) => grid.append(renderer(item, i)));
  } catch (err) {
    grid.append(el("p", "empty", "Could not load this section right now."));
    console.error(err);
  }
}

document.getElementById("year").textContent = new Date().getFullYear();

function renderRepo(r) {
  const card = el("article", "card");
  const meta = el("div", "card-meta");
  meta.append(el("span", "", r.language ?? "—"), el("span", "", `★ ${r.stars}`));
  card.append(meta, el("h3", "", r.name));
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

load("/github/repos", "repos-grid", renderRepo);
load("/projects/", "projects-grid", renderProject, { featuredFirst: true });
load("/certificates/", "certificates-grid", renderCertificate);