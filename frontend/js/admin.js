const $ = (id) => document.getElementById(id);
const QV_FIELDS = ["open_to", "work_preference", "availability", "location"];
const nz = (value) => value.trim() || null; // empty text becomes null

function say(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = isError ? "status error" : "status";
}

const authHeaders = () => ({ "X-Admin-Key": $("key").value.trim() });

function needKey() {
  if ($("key").value.trim()) return true;
  say("Enter the admin key first", true);
  return false;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch {}
    throw new Error(`${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  return res.json();
}

/* ---------- Resume + quick view ---------- */
async function loadCurrent() {
  try {
    const p = await api("/profile/");
    if (p.resume) $("json").value = JSON.stringify(p.resume, null, 2);
    QV_FIELDS.forEach((k) => ($(k).value = p.quick_view?.[k] ?? ""));
  } catch (e) {
    say(`Could not load current data (${e.message})`, true);
  }
}

$("extract").addEventListener("click", async () => {
  if (!needKey()) return;
  const file = $("file").files[0];
  if (!file) return say("Choose a PDF first", true);
  const body = new FormData();
  body.append("file", file);
  say("Reading your resume…");
  try {
    const data = await api("/resume/extract", { method: "POST", headers: authHeaders(), body });
    $("json").value = JSON.stringify(data, null, 2);
    say("Draft ready. Check it, edit if needed, then publish.");
  } catch (e) {
    say(e.message, true);
  }
});

$("publish").addEventListener("click", async () => {
  if (!needKey()) return;
  const file = $("file").files[0];
  if (!file) return say("Choose the PDF again so it can be published", true);
  try { JSON.parse($("json").value); } catch { return say("The draft is not valid JSON", true); }
  const body = new FormData();
  body.append("file", file);
  body.append("data", $("json").value);
  say("Publishing…");
  try {
    await api("/resume/publish", { method: "POST", headers: authHeaders(), body });
    say("Published. The site now shows this resume.");
  } catch (e) {
    say(e.message, true);
  }
});

$("save-qv").addEventListener("click", async () => {
  if (!needKey()) return;
  const body = Object.fromEntries(QV_FIELDS.map((k) => [k, $(k).value.trim()]));
  try {
    await api("/profile/quick-view", {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    say("Quick view saved.");
  } catch (e) {
    say(e.message, true);
  }
});

/* ---------- Projects and certificates (add, edit, delete) ---------- */
const KINDS = {
  certificates: {
    path: "/certificates/",
    listId: "certificate-list",
    formId: "certificate-form",
    cancelId: "c_cancel",
    noun: "Certificate",
    label: (x) => `${x.title} — ${x.issuer}${x.has_file ? " · PDF attached" : ""}`,
    read: () => ({
      title: $("c_title").value.trim(),
      issuer: $("c_issuer").value.trim(),
      issued_date: nz($("c_date").value),
      credential_id: nz($("c_id").value),
      credential_url: nz($("c_url").value),
      image_url: null,
      featured: false,
    }),
    fill: (x) => {
      $("c_title").value = x.title ?? "";
      $("c_issuer").value = x.issuer ?? "";
      $("c_date").value = x.issued_date ?? "";
      $("c_id").value = x.credential_id ?? "";
      $("c_url").value = x.credential_url ?? "";
    },
  },
};

const editing = { certificates: null }; // id being edited, or null

function smallButton(text, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function stopEdit(kind) {
  const cfg = KINDS[kind];
  editing[kind] = null;
  $(cfg.formId).reset();
  $(cfg.cancelId).hidden = true;
}

function startEdit(kind, item) {
  const cfg = KINDS[kind];
  editing[kind] = item.id;
  cfg.fill(item);
  $(cfg.cancelId).hidden = false;
  $(cfg.formId).scrollIntoView({ behavior: "smooth", block: "center" });
  say(`Editing "${cfg.label(item)}". Change what you need, then save.`);
}

async function removeItem(kind, item) {
  const cfg = KINDS[kind];
  if (!needKey()) return;
  if (!confirm(`Delete "${cfg.label(item)}"?`)) return;
  try {
    await api(`${cfg.path}${item.id}`, { method: "DELETE", headers: authHeaders() });
    say(`${cfg.noun} deleted.`);
    if (editing[kind] === item.id) stopEdit(kind);
    refresh(kind);
  } catch (e) {
    say(e.message, true);
  }
}

async function refresh(kind) {
  const cfg = KINDS[kind];
  const list = $(cfg.listId);
  try {
    const items = await api(cfg.path);
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "Nothing added yet.";
      list.replaceChildren(li);
      return;
    }
    list.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = cfg.label(item);
        li.append(
          name,
          smallButton("Edit", () => startEdit(kind, item)),
          smallButton("Delete", () => removeItem(kind, item))
        );
        return li;
      })
    );
  } catch (e) {
    say(`Could not load ${cfg.noun.toLowerCase()}s (${e.message})`, true);
  }
}

for (const kind of Object.keys(KINDS)) {
  const cfg = KINDS[kind];

  $(cfg.formId).addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!needKey()) return;
    const id = editing[kind];
    try {
      const saved = await api(id ? `${cfg.path}${id}` : cfg.path, {
        method: id ? "PUT" : "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(cfg.read()),
      });
      editing[kind] = saved.id; // if the PDF upload fails, saving again updates instead of duplicating
      $(cfg.cancelId).hidden = false;

      if (kind === "certificates" && $("c_file").files[0]) {
        const body = new FormData();
        body.append("file", $("c_file").files[0]);
        await api(`${cfg.path}${saved.id}/file`, { method: "POST", headers: authHeaders(), body });
      }
      say(id ? `${cfg.noun} updated.` : `${cfg.noun} added.`);
      stopEdit(kind);
      refresh(kind);
    } catch (e) {
      say(e.message, true);
      refresh(kind);
    }
  });

  $(cfg.cancelId).addEventListener("click", () => {
    stopEdit(kind);
    say("Edit cancelled.");
  });
}

loadCurrent();
refresh("certificates");
